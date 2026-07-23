# Migration AngularJS 1.5 → Angular (mode hybride)

Ce document explique l'état de la migration progressive de taiga-front d'AngularJS 1.5.10
(CoffeeScript/Jade/SASS, build gulp) vers Angular moderne, et le patron à suivre pour
continuer à migrer les modules restants.

## Pourquoi un mode hybride

AngularJS 1.x et Angular (2+) sont deux frameworks différents : il n'existe pas de mise à
jour incrémentale de l'un vers l'autre. La stratégie retenue est `@angular/upgrade` : les
deux frameworks tournent dans la même page, on migre module par module, puis on retire
AngularJS une fois que tout est passé côté Angular.

## Ce qui a été mis en place

- **Node** : `.nvmrc` et la CI (`​.github/workflows/main.yml`) sont passés de 16.19.1 à
  20.11.1 (Angular 17+ exige Node ≥ 18.13).
- **SASS** : `gulpfile.js` compile désormais via Dart Sass (`sass`) au lieu de `node-sass`
  (déprécié). Aucun fichier `.scss` n'a eu besoin d'être modifié pour ça.
- **Workspace Angular** (`angular.json`, `tsconfig.json`, `tsconfig.app.json`,
  `src/main.ts`) : un projet Angular CLI minimal, buildé **séparément** du pipeline gulp
  existant, avec `npm run build:ng` (ou `npm run watch:ng` en développement). Le builder
  utilisé est `@angular-devkit/build-angular:browser` (pas le nouveau builder `application`
  basé esbuild/ESM) pour produire des bundles classiques (`runtime.js`, `polyfills.js`,
  `main.js`) chargeables via de simples balises `<script>`, compatibles avec le système de
  chargement séquentiel déjà en place dans `app-loader.coffee`.
- **Intégration au build gulp** : une tâche `ng-app` (gulpfile.js) copie le contenu de
  `dist-ng/` dans le dossier versionné `js/` du build, au même endroit que `libs.js`/
  `app.js`. Elle est `allowEmpty` : tant que `npm run build:ng` n'a pas été lancé au moins
  une fois, le build legacy continue de fonctionner sans erreur (juste sans le bundle
  Angular).
- **Bootstrap hybride** : `app-loader/app-loader.coffee` ne fait plus
  `angular.bootstrap(document, ['taiga'])` directement. Il charge maintenant
  `runtime.js` → `polyfills.js` **en tout premier, avant même `libs.js`**, puis `libs.js` →
  `templates.js` → (plugins) → `elements.js` → `app.js` → une fois les emojis chargés,
  `main.js`. Le point important : `polyfills.js` (zone.js) doit être chargé avant tout le
  reste, pas après comme un ajout de fin de chaîne - voir l'écart ci-dessous. C'est
  `src/app/app.module.ts` qui
  fait `platformBrowserDynamic().bootstrapModule(AppModule)`, et son `ngDoBootstrap()`
  appelle `UpgradeModule.bootstrap(document.body, ['taiga'])` — donc AngularJS démarre
  toujours, juste indirectement.
- **Partage de l'instance AngularJS** : `libs.js` charge `node_modules/angular/angular.js`
  comme script classique (il pose `window.angular`). Le bundle Angular ne doit pas
  embarquer une seconde copie d'AngularJS, sinon les deux frameworks ne se "voient" pas.
  `src/vendor/angular-global.ts` réexporte `window.angular`, et le mapping `paths` dans
  `tsconfig.json` (`"angular": ["src/vendor/angular-global.ts"]`) fait que tout
  `import ... from "angular"` dans `src/` résout vers ce fichier plutôt que vers
  `node_modules/angular`. C'est la technique documentée officiellement par Angular pour ce
  cas de figure (AngularJS chargé par `<script>`, pas par npm/webpack).

## Modules migrés

### `home`

- `HomeComponent` (`src/app/home/home.component.ts` + `.html`) remplace
  `app/modules/home/home.controller.coffee` + `home.jade`.
- Downgradé en directive AngularJS `tg-home` (`src/app/home/register-legacy.ts`), enregistrée
  sur le module `taigaHome` déjà existant (`app/modules/home/home.module.coffee`, inchangé).
- La route `/` (`app/coffee/app.coffee`) utilise maintenant
  `template: "<tg-home></tg-home>"` au lieu de `templateUrl`/`controller`.
- Les deux directives enfants du template d'origine (`tg-working-on`,
  `tg-home-project-list`) **restent en AngularJS** — elles ne sont pas triviales à migrer
  seules (cf. plus bas) — et sont rendues depuis le template Angular via des wrappers
  `UpgradeComponent` (`src/app/upgraded/`). C'est le sens inverse de `downgradeComponent` :
  utiliser un composant AngularJS depuis un template Angular.
- Le filtre `{{ x | translate }}` d'angular-translate n'a pas d'équivalent Angular natif :
  `src/app/shared/translate.pipe.ts` fournit un pipe `tgTranslate` qui appelle
  `$translate.instant()` (service AngularJS récupéré via `src/app/shared/ajs-tokens.ts`).
- **`app/modules/home/home.service.coffee` (`tgHomeService`) n'a volontairement pas été
  touché** : en creusant les dépendances réelles, ce service n'est pas utilisé par
  `HomeController` mais par le contrôleur du directive `tg-working-on`
  (`working-on.controller.coffee`), qui reste 100 % AngularJS pour l'instant. Le
  transformer aurait élargi la portée de ce module pilote à trois modules à la fois. Il
  continue de vivre sur `taigaHome` sans changement.

Fichiers supprimés (remplacés, plus de raison d'être) : `home.controller.coffee`,
`home.jade`, `home-controller.spec.coffee`.

### `discover-home`

Deuxième module migré, choisi pour la même raison que `home` (route + template simples) et
pour exercer un cas que `home` ne couvrait pas : un vrai binding de données vers un enfant
AngularJS (pas juste des enfants sans binding).

- `DiscoverHomeComponent` (`src/app/discover-home/`) remplace
  `discover-home.controller.coffee` + `discover-home.jade`, downgradé en `<tg-discover-home>`
  sur le module `taigaDiscover` existant. Route `/discover`
  (`app/coffee/app.coffee`) : `template: "<tg-discover-home></tg-discover-home>"`.
- Quatre enfants encore-AngularJS wrappés en `UpgradeComponent`
  (`src/app/upgraded/tg-discover-search-bar`, `tg-featured-projects`, `tg-most-liked`,
  `tg-most-active`). Leurs propres enfants imbriqués (`tg-highlighted`,
  `tg-discover-home-order-by`) n'ont pas besoin de wrapper séparé : une fois qu'Angular a
  délégué le rendu d'un `UpgradeComponent` à AngularJS, tout ce qui est à l'intérieur de son
  propre template reste compilé par AngularJS, Angular ne le voit jamais.
- `tg-discover-search-bar` est le premier wrapper `UpgradeComponent` avec de vrais bindings :
  `@Input() q`/`@Input() filter` (bindings AngularJS `=`, non utilisés ici, laissés non liés
  exactement comme dans le template d'origine) et `@Output() onChange` (binding `&`,
  invoqué côté AngularJS avec `onChange({filter, q})` -
  `discover-search-bar.controller.coffee` - donc `$event` côté Angular vaut `{filter, q}` ;
  `(onChange)="onSubmit($event.q)"` reproduit exactement `onSubmit(q)` du contrôleur
  d'origine qui ignorait `filter`). `UpgradeComponent` lit les bindings réels de la
  directive AngularJS déjà enregistrée : déclarer un `@Input`/`@Output` du même nom suffit,
  pas besoin de reproduire le detail du binding.
- Nouveau service partagé injecté : `tgAppMetaService` (déjà utilisé par 20+ autres
  fichiers hors discover, comme `tgCurrentUserService`/`$tgNavUrls` pour `home`) et
  `$tgLocation` - à ne pas confondre avec `$location` : `$tgLocation` est une factory
  (`app/coffee/modules/base/location.coffee`) qui ajoute juste `noreload()` et
  `isInCurrentRouteParams()` sur l'objet `$location` existant (même instance), mais le
  contrôleur d'origine injectait bien `$tgLocation` par son nom - token Angular séparé
  (`AJS_TG_LOCATION`) ajouté dans `ajs-tokens.ts` par exactitude, même si aujourd'hui les
  deux tokens résolvent au même objet.
- `tgDiscoverProjectsService` (utilisé par les 4 enfants AngularJS) est resté 100 %
  isolé au module discover - vérifié par grep sur tout `app/` avant de commencer, comme
  recommandé dans le patron ci-dessous.

Fichiers supprimés : tout `app/modules/discover/discover-home/` (`discover-home.controller.coffee`,
`discover-home.jade`, `discover-home.controller.spec.coffee`) - aucune autre référence
trouvée ailleurs dans le code.

Vérifié comme pour `home` : `ng build` (strictTemplates) propre, `gulp` (watch actif a
recompilé automatiquement à la sauvegarde), suite karma **470/470** (472 - 2 tests du
contrôleur supprimé, cohérent), rendu réel en navigateur headless sur `/discover`
identique à avant (recherche, projets en vedette, most-liked/most-active), aucune erreur
console.

### `discover-home-order-by` et `tg-svg` (migration "leaf en place")

Contrairement à `home`/`discover-home` (une route entière remplacée), ceci est le premier
exemple de **migration d'un composant enfant en place**, sans toucher à une route : la
directive AngularJS `tgDiscoverHomeOrderBy` (utilisée par `most-liked.jade`/`most-active.jade`,
encore 100 % AngularJS) est remplacée par `DiscoverHomeOrderByComponent`
(`src/app/discover-home-order-by/`), downgradée **sous le même nom de directive** - donc en
théorie aucun appelant n'a besoin de changer.

**En théorie seulement.** Premier essai : le champ `orderBy` recevait la chaîne littérale
`"vm.currentOrderBy"` au lieu de sa valeur (`"year"`), et cliquer sur une option du menu
n'avait aucun effet observable. Cause : `downgradeComponent` reconnaît plusieurs
conventions d'attributs bien précises pour ses `@Input`/`@Output`, et elles ne sont **pas**
celles qu'un template AngularJS "classique" (isolate scope `=`/`&`) utilise :

- **Input** : un attribut simple `order-by="vm.currentOrderBy"` est traité comme une chaîne
  interpolée façon binding `@` (via `$observe`, qui ne fait qu'interpoler `{{ }}` -
  une expression nue sans `{{ }}` reste donc du texte littéral). Pour obtenir la vraie
  valeur évaluée, l'appelant doit utiliser `bind-order-by="vm.currentOrderBy"` (ou
  `[order-by]="vm.currentOrderBy"`).
- **Output** : `downgradeComponent` déduit le nom d'attribut "classique" en préfixant `on`
  devant le nom de la propriété (`change` → `onChange` → attribut `on-change`). Si on
  nomme la propriété `onChange` (par réflexe, pour garder le nom de l'ancien binding
  AngularJS `&`), l'attribut attendu devient `onOnChange` - ça ne matche jamais
  `on-change`. **Nommer la propriété `change` (sans le préfixe `on`)**, pas `onChange`.
- Toujours pour l'output : l'expression appelée par l'appelant ne reçoit **qu'un seul**
  local nommé `$event` (la valeur émise), pas les locals arbitraires qu'une AngularJS `&`
  binding accepte normalement. `on-change="vm.orderBy(orderBy)"` (qui marchait avec
  l'ancienne directive) devient `on-change="vm.orderBy($event.orderBy)"`.

Conséquence concrète : `most-liked.jade`/`most-active.jade` (toujours 100 % AngularJS,
donc a priori hors scope de cette migration) ont dû recevoir chacun une modification
d'une ligne pour appeler correctement le nouveau composant downgradé. C'est le seul type
de changement acceptable dans du code "non migré" pendant cette transition : adapter la
syntaxe d'appel à un enfant qui vient d'être downgradé, rien d'autre.

Vérifié bout en bout avec un vrai clic (via CDP, pas juste un dump statique du DOM) :
cliquer sur "Last week" déclenche bien une requête réseau
`GET /api/v1/projects?...&order_by=-total_fans_last_week`, confirmant que le cycle
complet clic → `@Output` Angular → expression AngularJS → contrôleur AngularJS → requête
HTTP fonctionne.

`tg-svg` (`app/coffee/modules/common.coffee`) a aussi été wrappé en `UpgradeComponent`
(`src/app/upgraded/tg-svg.upgraded-directive.ts`) à cette occasion - c'est la primitive
d'icône utilisée dans quasiment tous les templates, donc un investissement rentabilisé
dès le prochain module.

### Écart connu par rapport au plan initial : tests
Le plan prévoyait de migrer les tests du module vers "Jasmine/Karma via Angular CLI". En
pratique, le `karma.conf.js` existant est verrouillé sur **karma `^0.13.10`** (2015, pour
le duo mocha/chai/coffee), alors que le builder de test standard d'Angular CLI
(`@angular-devkit/build-angular:karma`) attend une version moderne de karma (v6+) — et
`package.json` ne peut avoir qu'une seule entrée `"karma"`. Bumper karma pour satisfaire
Angular casserait très probablement la suite de tests legacy (l'API de configuration a
beaucoup changé entre karma 0.13 et 6.x). Plutôt que de livrer une config `ng test` non
vérifiée ou de risquer une régression sur les ~400 specs existantes, j'ai laissé cette
question ouverte : **`ng test` n'est pas encore câblé**. Deux options pour la suite :
1. Moderniser d'abord la suite legacy (karma 6.x + mocha/chai à jour) puis ajouter `ng
   test` par-dessus.
2. Faire tourner les futurs specs Angular avec un runner indépendant de karma (ex.
   web-test-runner ou Jest via `jest-preset-angular`), pour éviter le conflit de version.

En attendant, la vérification du module `home` se fait manuellement dans le navigateur
(cf. section Vérification ci-dessous).

Conséquence immédiate déjà rencontrée : `npm install` échoue avec une erreur `ERESOLVE`
(`@angular-devkit/build-angular` attend un peer optionnel `karma@^6.3.0`, alors que
`karma-coffee-preprocessor` exige `karma@^0.13.10`). Comme on n'utilise pas le builder de
test Angular, c'est un faux positif de la résolution stricte de npm - `.npmrc`
(`legacy-peer-deps=true`) le contourne. Ça n'installe pas une seconde version de karma :
`karma@0.13.22` reste la seule résolue, exactement comme avant.

### Écart connu : sourcemaps du bundle Angular désactivées
`angular.json` a `"sourceMap": false` pour la configuration `development` du bundle Angular.
En l'activant (`{scripts:true, styles:true, vendor:false}` ou `true`), `source-map-loader@5`
plante sur les fichiers précompilés d'Angular lui-même (`zone.js`, `@angular/core`,
`@angular/platform-browser`, `@angular/upgrade/static`) avec
`TypeError: Cannot read properties of undefined (reading 'date')` - un bug d'outillage
(source-map-loader/webpack) plutôt qu'un problème de notre code. Sans impact fonctionnel,
juste moins pratique pour déboguer le bundle Angular en dev ; à creuser plus tard (probable
solution : exclure `node_modules/@angular` et `node_modules/zone.js` du chargement des
sourcemaps, ou attendre un correctif upstream).

Corollaire : les fichiers `.js` publiés par les paquets npm (`rxjs`, `@angular/*`, `zone.js`)
contiennent leurs propres commentaires `//# sourceMappingURL=...`, qui ne sont normalement
nettoyés que par `source-map-loader` - désactivé ici. `npm run build:ng` fait donc tourner
`scripts/strip-ng-sourcemap-comments.js` juste après `ng build` pour les retirer du bundle
final (sinon le navigateur essaie de récupérer des fichiers `.map` inexistants, tombe sur le
fallback HTML de la SPA, et logue une erreur de parsing JSON dans les devtools - bruit
cosmétique uniquement, mais autant l'éviter). `watch:ng` n'applique pas ce nettoyage (usage
dev uniquement).

### Bug corrigé : "too much recursion" dans polyfills.js (zone.js)
Symptôme observé au premier essai en navigateur réel : `Uncaught InternalError: too much
recursion` dans `polyfills.js`, en boucle sur un getter. Cause : zone.js (dans
`polyfills.js`) monkey-patche des API globales (`addEventListener`, `XMLHttpRequest`,
timers...) pour que le change detection d'Angular suive le travail asynchrone. Il doit faire
ça **avant** que quoi que ce soit d'autre ne patche les mêmes API, sinon les patches
s'emboîtent dans le mauvais sens et peuvent se rappeler eux-mêmes à l'infini. Ici,
`raven-js` (Sentry, chargé dans `libs.js`) patche déjà `XMLHttpRequest`/`addEventListener` -
et `polyfills.js` se chargeait en tout dernier (après `libs.js`, `app.js`, etc.), donc
par-dessus les patches de raven-js, dans le mauvais ordre.

Correction (`app-loader/app-loader.coffee`) : `runtime.js` puis `polyfills.js` se chargent
maintenant **en tout premier**, avant même `libs.js` - ils n'ont aucune dépendance sur le
reste. Seul `main.js` (le vrai bootstrap Angular, qui a besoin de `window.angular` posé par
`libs.js`/`app.js`) reste chargé en dernier, une fois les emojis prêts, comme avant. Vérifié
en navigateur réel (Chrome headless) : plus de récursion, page rendue normalement.

## Patron à suivre pour migrer un module suivant

1. Repérer ses dépendances réelles (services/directives utilisés *et* utilisateurs) avant
   de commencer — ne pas supposer qu'un module de `app/modules/<x>/` est isolé juste parce
   qu'il a son propre dossier. Grep les noms de service/controller dans tout `app/`.
2. Convertir le controller/directive à migrer en `@Component` Angular (TypeScript +
   template HTML, en gardant les mêmes classes CSS que le `.scss` existant pour ne rien
   casser côté style).
3. Pour chaque service/directive AngularJS encore utilisé par ce composant : soit
   l'injecter via un token `upgradedService(...)` (`src/app/shared/ajs-tokens.ts`) s'il
   s'agit d'un service, soit l'envelopper avec `UpgradeComponent` (`src/app/upgraded/`)
   s'il s'agit d'une directive/composant.
4. Downgrader le nouveau composant (`downgradeComponent`) et l'enregistrer comme directive
   sur le module AngularJS existant (voir `register-legacy.ts`). **Si des templates
   encore-AngularJS appellent directement ce composant** (migration "en place", pas une
   route - cf. `discover-home-order-by` ci-dessus), leur syntaxe d'appel doit changer :
   `bind-x="..."` (pas `x="..."`) pour chaque input, propriété `@Output()` nommée SANS
   préfixe `on` (`change`, pas `onChange`) pour que l'attribut `on-x="..."` existant
   matche, et `$event` (pas des locals arbitraires) dans l'expression appelée par cet
   attribut. Vérifier avec un vrai clic/interaction (CDP), pas juste un dump statique du
   DOM - un mauvais binding ne lève aucune erreur, il échoue silencieusement.
5. Remplacer la route ngRoute (ou le `templateUrl` du parent) par le tag de l'élément
   downgradé.
6. Déclarer le nouveau composant/directive/pipe dans `src/app/app.module.ts`.
7. Supprimer les fichiers `.coffee`/`.jade` devenus inutiles - mais seulement ceux dont
   plus rien ne dépend (cf. étape 1).

## Hors scope (feuille de route)

- Les ~34 autres modules feature (`projects`, `epics`, `wiki`, `attachments`,
  `notifications`, etc.) - module par module, feuilles d'abord.
- Bascule ngRoute → Angular Router (dernière étape).
- Suppression finale d'AngularJS, de `@angular/upgrade`, et du pipeline gulp coffee/jade.
- Résoudre le conflit de version karma pour activer `ng test` (voir ci-dessus).
- Modules sans aucun test aujourd'hui (`resources`, `utils`, `attachments`,
  `notifications`) : en écrire avant/pendant leur migration.

## Vérification

Déjà fait et vert dans cette passe :
- `npm install --legacy-peer-deps` : installe proprement (717 paquets ajoutés).
- `npm run build:ng` : build Angular réussi, produit `dist-ng/{runtime,polyfills,main}.js`.
  Le compilateur Angular tourne avec `strictTemplates: true` (tsconfig.json) et n'a rien
  signalé - c'est une vérification assez forte que `HomeComponent` (pipe `tgTranslate`,
  sélecteurs `tg-working-on`/`tg-home-project-list`) est cohérent avec ce qui est déclaré
  dans `AppModule`.
- `npx gulp deploy` : build legacy complet réussi (sass, jade, coffee, libs, `ng-app`
  compris) ; `dist/<version>/js/` contient bien `runtime.js`/`polyfills.js`/`main.js` à côté
  de `libs.js`/`app.js`, et `app.js` compilé contient bien `tg-home` (la route `/`).
- `node --check` sur chaque bundle généré (`app-loader.js`, `app.js`, `libs.js`,
  `templates.js`, `runtime.js`, `polyfills.js`, `main.js`) : tous syntaxiquement valides.
- `npm test` (karma, suite legacy mocha/chai/coffee) : **472/472 tests passent**, aucune
  régression après le bump Node 20 / retrait de node-sass.

Pas fait dans cette passe (nécessite un navigateur interactif + un `taiga-back` lancé, non
disponibles dans cet environnement d'exécution) :
- Charger réellement `/` dans un navigateur et vérifier que `<tg-home>` s'affiche, que
  `tg-working-on`/`tg-home-project-list` rendent leur contenu à l'intérieur, et que la
  redirection vers `/discover` fonctionne bien si déconnecté.
- Vérifier qu'aucune erreur JS n'apparaît dans la console au chargement (interaction
  AngularJS/Angular au moment précis du bootstrap).
  supprimée à part celles du controller `home` qui n'existe plus).
