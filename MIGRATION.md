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
- **`@angular/forms`** (`FormsModule`) ajouté aux dépendances et importé dans
  `AppModule` à l'occasion de `wip-limit-selector`, pour `[(ngModel)]` sur un champ de
  formulaire simple plutôt que de câbler `(input)`/`[value]` à la main à chaque fois.

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

### `discover-search-list-header`

Même patron "leaf en place" que `discover-home-order-by`, un cran plus riche : deux
sous-panneaux de filtre (`ng-if` → `*ngIf`), classes actives (`ng-class` → `[class.active]`),
et un détail amusant repéré en lisant le contrôleur d'origine : le template appelait
`vm.toggleClose()` sur `ng-mouseleave`, mais cette méthode n'a jamais existé sur le
contrôleur - un appel silencieusement no-op en AngularJS. Reproduit fidèlement en ne
câblant rien du tout sur `(mouseleave)`, plutôt que d'inventer un comportement qui
n'a jamais existé.

Seul appelant encore-AngularJS à adapter : `discover-search.jade` (`bind-order-by`,
`$event.orderBy`). Vérifié comme le précédent avec un clic réel via CDP : ouvrir le filtre
"Most liked" puis choisir "Last week" déclenche la requête réseau attendue
(`order_by=-total_fans_last_week&q=a`). karma **459/459** (466 - 7 tests du contrôleur
supprimé).

### `notifications`

Premier module migré au niveau de la route depuis `discover-home`. Piège découvert en
creusant les dépendances (règle n°1 du patron) : la directive enfant `tg-notifications-list`
(`app/modules/notifications/notifications-list/`, laissée 100 % AngularJS) utilise
`controller: "Notifications"` - **le même contrôleur AngularJS que la route**, dans sa
propre instance isolée. Si `notifications.controller.coffee` avait été supprimé (ce que le
patron habituel aurait fait), cet enfant se serait cassé au chargement (référence de
contrôleur introuvable). **`notifications.controller.coffee` reste donc en place,
intact** - seul `notifications.jade` (le template de la route) a été supprimé. Duplication
temporaire assumée : la logique existe maintenant à la fois dans l'ancien contrôleur
CoffeeScript (pour l'usage du enfant) et dans `NotificationsComponent` (pour la route) -
même situation que `tgHomeService` pour le module `home`.

`NotificationsController` héritait de `mixOf(taiga.Controller, taiga.PageMixin,
taiga.FiltersMixin)`, mais son propre corps n'appelle aucune méthode de ces mixins
(`fillUsersAndRoles`, `selectFilter`, etc.) - rien à répliquer, c'était du poids mort pour
ce contrôleur précis (vérifié en lisant `app/coffee/modules/controllerMixins.coffee`
en entier).

Les événements `notifications:dismiss`/`notifications:new`/`notifications:dismiss-all`
passent par `$rootScope` (nouveau token `AJS_ROOT_SCOPE`) plutôt que par un `$scope`
d'instance (qui n'existe pas pour un composant Angular) : `$rootScope.$emit(...)` est
l'équivalent le plus fidèle de l'original `@scope.$emit(...)` pour tout listener enregistré
via `$rootScope.$on` (c'est le cas ici et dans `dropdown-notifications`). Un listener
hypothétique sur un `$scope.$on` d'une branche ni ancêtre ni `$rootScope` ne recevrait pas
plus l'événement qu'avant - non-régression, pas une garantie absolue d'équivalence totale.

Vérification : sans backend, `/notifications` (route `access: {requiresLogin: true}`)
redirige vers `/login` - comportement inchangé, guard indépendant de ce composant. Pour
vérifier le rendu réel, un faux utilisateur a été injecté via
`localStorage.setItem('userInfo', ...)` (c'est exactement ce que lit
`tgCurrentUserService.getUser()`, `app/modules/services/current-user.service.coffee`)
avant navigation : la page affiche bien "My events", "Dismiss all" désactivé (liste vide),
et `tg-notifications-list` rend toujours son propre contenu AngularJS normalement. Aucune
erreur console. karma **459/459** (aucun test supprimé, `notifications` n'avait pas de
spec pour son contrôleur).

### `external-app`

Troisième module au niveau route. Contrairement à `home`/`discover-home`/`notifications`,
aucune autre référence au contrôleur `"ExternalApp"` nulle part ailleurs dans le code
(vérifié par grep) - donc, cette fois, `external-app.controller.coffee` et son spec ont pu
être supprimés sans réserve, comme `discover-home.controller.coffee` avant lui.

Le template original utilisait `tg-avatar` (`app/modules/components/avatar/avatar.directive.coffee`),
une directive-attribut **sans template propre** : elle ne fait que muter les attributs
`src`/`title`/`alt`/`background` de son élément hôte via une fonction `link`. `UpgradeComponent`
est conçu pour des directives qui rendent leur propre contenu (`template`/`templateUrl`) -
pas vraiment adapté ici. Plutôt que de forcer un wrapper, `tgAvatarService.getAvatar()`
(nouveau token `AJS_AVATAR_SERVICE`) est appelé directement dans le composant et le
résultat lié en binding Angular classique sur un `<img>` normal - plus simple, et une vraie
migration plutôt qu'un enrobage pour une directive qui n'était que de la logique
présentationnelle.

Le template utilisait aussi `translate="CLE" translate-values="{...}"` (la **directive**
angular-translate, pas le filtre `| translate`). `TgTranslatePipe`
(`src/app/shared/translate.pipe.ts`) a été étendu pour accepter un second paramètre de
valeurs d'interpolation (`{{ 'CLE' | tgTranslate:{app: application.get('name')} }}`),
puisque `$translate.instant(key, values)` les accepte déjà nativement - un investissement
réutilisable, comme `tg-svg` avant lui.

Un `include ../../svg/logo-color.svg` (inclusion Jade, au moment de la compilation) a été
remplacé par le contenu SVG copié directement dans le template Angular - même résultat
(le SVG était déjà inlined en dur dans le HTML final avant), juste sans l'étape de
compilation Jade.

**Écart de vérification (limitation d'environnement, pas du composant) :** `/external-apps`
tente une redirection vers `/login?unauthorized=true` avant même que le composant ne
s'affiche, malgré le faux `userInfo` en `localStorage`. Testé et confirmé : **le même
comportement se produit sur `/profile`, une route non touchée par cette migration** -
preuve que ce n'est pas lié à `ExternalAppComponent` mais à un mécanisme d'authentification
plus strict (probablement une vérification de token réelle contre le backend) qui ne peut
pas être satisfait avec juste `localStorage` sans un vrai `taiga-back`. Vérification donc
limitée à : build Angular propre (`strictTemplates`), relecture attentive de la fidélité du
portage, et karma **455/455** (459 - 4 tests du contrôleur supprimé).

### `profile-hints` (et pourquoi pas `profile` en entier)

Le plan initial pour ce cinquième module était de migrer la route `/profile` en entier
(même patron que `home`/`discover-home`/`notifications`/`external-app`). En creusant son
template (`profile.jade`), il s'est avéré nettement plus complexe que prévu :
`tg-profile-tabs`/`tg-profile-tab` utilisent `transclude: true` **et**
`require: "^tgProfileTabs"` (le tab enfant va chercher le contrôleur du tabset parent en
remontant l'arbre de compilation AngularJS). Si on wrap `tg-profile-tabs` en
`UpgradeComponent` et qu'on essaie de wrap CHAQUE `tg-profile-tab` séparément pour les
placer dans le template Angular, chacun devient sa propre racine de compilation AngularJS
isolée - `require: "^tgProfileTabs"` ne retrouverait alors plus le contrôleur parent,
puisque les deux ne feraient plus partie du même arbre de compilation AngularJS. Ce
patron (transclusion imbriquée + `require` inter-directives) ne rentre pas dans le
patron "wrap simple" établi jusqu'ici, et le tester correctement demanderait une vraie
session utilisateur (page `/profile`, bloquée par le mur d'authentification - cf.
`external-app` ci-dessus). Plutôt que de forcer quelque chose de risqué et non vérifiable,
`profile` en entier est reporté à plus tard (noté dans la feuille de route) et remplacé
par un composant plus modeste **à l'intérieur** de `profile` : `tg-profile-hints`
(un encart d'astuce aléatoire dans la barre latérale du profil).

Patron "leaf en place", comme `discover-home-order-by`/`discover-search-list-header`, mais
plus simple encore : aucun binding (`scope: {}`, aucun attribut passé par l'appelant), donc
aucun des pièges input/output rencontrés précédemment.

**Nouveau piège découvert, cette fois côté élément vs attribut** : la directive d'origine
était utilisée comme **attribut** (`div.profile-hints(tg-profile-hints)`), mais le
directive definition object que génère `downgradeComponent` a toujours `restrict: 'E'`
(élément uniquement - vu dans `node_modules/@angular/upgrade/fesm2022/static.mjs`). Un
downgrade ne peut donc **jamais** être appelé comme attribut, même si l'original
l'était. Corrigé en changeant l'appelant (`profile-sidebar.jade`, toujours 100 % AngularJS)
en syntaxe élément : `tg-profile-hints.profile-hints` (classe conservée pour le style).

Vérifié : `ng build` propre, template `profile-sidebar.html` recompilé confirmé (contient
bien `<tg-profile-hints class="profile-hints">`, vérifié directement dans le
`templates.js` généré). Rendu réel non testable : `/profile` est bloqué par le même mur
d'authentification qu'`external-app` (confirmé indépendant de ce changement précis).
karma **454/454** (455 - 1 test du contrôleur supprimé).

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

### `project-archived-warning`

Leaf en place, le plus simple de tous jusqu'ici : aucun binding, un seul service
(`tgProjectService`, déjà partagé partout), et déjà utilisé en syntaxe élément par ses
deux appelants (`project.jade`, `epics-dashboard.jade`) - donc aucune retouche de leur
côté, ni pour le binding ni pour élément/attribut. Vérifié : build propre, karma inchangé
(pas de spec pour ce contrôleur).

### `tribe-button`

Leaf en place. Premier composant à référencer un asset statique versionné
(`images/tribe-logo.png`) : le `#{v}` de Jade (interpolé par gulp à la compilation) n'existe
pas côté Angular CLI - remplacé par `window._version` (la même valeur, exposée en global au
runtime par `app-loader.coffee`, donc strictement équivalent). Appelant
(`us-detail.jade`) mis à jour : `us-id`/`project-slug` → `bind-us-id`/`bind-project-slug`.

### `live-announcement`

Leaf en place, mais rendu au niveau du **shell applicatif** (`app/index.jade`, en dehors de
`ng-view`) plutôt que dans une route ou un composant imbriqué - comme `tg-navigation-bar`/
`tg-legacy` qui y vivent déjà. Ça fonctionne pareil : `UpgradeModule.bootstrap(document.body, ...)`
compile tout `document.body` en une seule passe AngularJS au démarrage, qu'un élément soit
dans `ng-view` ou non. Seul component dont l'état vient de getters lisant directement un
service partagé mutable (`tgLiveAnnouncementService.open/title/desc`, pas un Observable) -
ça reste à jour parce que zone.js patche assez d'API globales pour qu'Angular relance sa
détection de changements à peu près à chaque tick. Appelant (`app/index.jade`) : attribut
→ élément (`div(tg-live-announcement)` → `tg-live-announcement`).

Vérifié en navigateur réel (pas seulement au build) : rendu sans erreur sur `/discover`
(un `<tg-live-announcement ng-version="...">` avec son état par défaut), confirmant que le
shell entier reste compilable après l'ajout.

### `vote-button`

Leaf en place. Premier exemple de binding `=` portant sur une **valeur de fonction** plutôt
qu'une expression `&` : `onUpvote`/`onDownvote` sont des références de fonctions passées
telles quelles par l'appelant (`ctrl.onUpvote`), pas des expressions à invoquer avec des
locals - donc `@Input()` simples, appelées directement (`this.onUpvote()`), sans
`@Output()`/`EventEmitter` ni convention `$event`. Appelant (`issues-detail.jade`) : attribut
→ élément et `item`/`on-upvote`/`on-downvote` → `bind-item`/`bind-on-upvote`/`bind-on-downvote`.

Simplification assumée et documentée : l'original enveloppait le compteur avec `tg-loading`
(`app/coffee/modules/common/loading.coffee`), une directive sans template propre qui fait
de la manipulation DOM jQuery pour afficher un spinner overlay pendant `vm.loading`. Comme
`tg-avatar`, ce n'est pas un bon candidat `UpgradeComponent`. L'état `loading` est conservé
et exposé à l'identique (le spec `vote-button.controller.spec.coffee`, supprimé, vérifiait
exactement ce comportement), seul le spinner visuel n'est pas reproduit - jugé disproportionné
pour un effet cosmétique bref, plutôt que de laisser un piège non documenté.

### `wip-limit-selector` (et un bug corrigé au passage)

Leaf en place, utilisé deux fois dans `project-kanban-swimlanes.jade`, chaque fois à
l'intérieur d'un `ng-repeat` - fonctionne normalement, chaque itération AngularJS instancie
sa propre copie du composant downgradé avec sa propre valeur `status`.

**Correction (⚠️ ancienne entrée ci-dessous invalidée, voir plus bas)** : ce paragraphe
affirmait que `"$tgResources"` (avec `$`) était un nom cassé/jamais enregistré, et que le
contrôleur original injectait donc un service inexistant. **C'était faux** - erreur de ma
part, pas un bug de l'app. Détail complet dans la section "Correction : `$tgResources` vs
`tgResources`" plus bas. Le composant utilise maintenant `AJS_TG_RESOURCES` (le vrai
`$tgResources`), pas `AJS_RESOURCES`.

Autres écarts mineurs, tous des impasses de l'original (mêmes catégories que
`toggleClose`/`ng-title` déjà rencontrées) :
- `ng-value="statusWipLimit"` référence une variable qui n'a jamais existé - omis.
- État partagé entre le `$scope` de la directive (`displayWipLimitSelector`) et un
  contrôleur séparé (`status`, `new_wip_limit`) - unifié en une seule classe, aucune
  différence fonctionnelle.
- `tg-autofocus` (encore une directive sans template propre, même famille que `tg-avatar`/
  `tg-loading`) : son seul effet utile ici (focus du champ après affichage) reproduit
  directement via `ViewChild`/`setTimeout` plutôt que wrappé.

Appelant : attributs `status="status"` (×2) → `bind-status="status"`.

Nouvelle dépendance de workspace : `@angular/forms` (`FormsModule`) pour `[(ngModel)]` sur
le champ de saisie du nouveau WIP limit.

### Deuxième lot de leafs en place (9 modules)

Neuf composants de plus, tous "leaf en place", résumés ensemble pour éviter de répéter le
même patron neuf fois. Détail complet dans les messages de commit respectifs.

- **`input-search`** : le seul fichier de tout le codebase déjà écrit avec l'API
  `.component()` (bindings `{q: '<', change: '&'}`) plutôt que `.directive()` - portage le
  plus direct de tous. 4 appelants (`backlog`/`taskboard`/`issues`/`kanban.jade`).
- **`board-zoom` / `taskboard-zoom` / `kanban-board-zoom`** : une famille de 3, migrée
  ensemble puisque les deux derniers ne sont que des wrappers d'état (clé de stockage +
  liste de "niveaux de zoom") autour du premier (le radio-group présentationnel). Premier
  exemple de **binding bidirectionnel réel** : `value`/`levels` sur `tg-board-zoom` utilisent
  `@Input() value` + `@Output() valueChange`, qu'un appelant encore-AngularJS adresse via
  `bindon-value="..."` (pas `bind-value` + un output séparé) - `downgradeComponent` reconnaît
  cette convention "banana box" nativement. `tg-bind-scope` (pur outil de debug jQuery) omis.
- **`detail-nav`** : le plus simple des trois "detail" - un seul `@Input() item`. **⚠️
  Utilisait `AJS_RESOURCES`, corrigé depuis vers `AJS_TG_RESOURCES` - voir la section
  "Correction : `$tgResources` vs `tgResources`" plus bas, l'affirmation d'origine ici
  était fausse.**
- **`swimlane-selector`** : utilisait `require: "ngModel"` pour son binding de sortie (le
  swimlane choisi) - `downgradeComponent` n'a pas d'équivalent direct pour l'intégration
  formulaire `ngModel` d'AngularJS. Simplifié en paire `value`/`valueChange` classique
  (banana box), l'appelant passe de `ng-model="..."` à `bindon-value="..."`. Contient un
  `tg-repeat` sur une petite liste (`*ngFor` sur un `Immutable.List`, qui fonctionne
  nativement puisqu'il implémente `Symbol.iterator`).
- **`color-selector`** : mouseenter/mouseleave jQuery posés séparément sur deux éléments
  dans l'original (le déclencheur et le panneau du dropdown) fusionnés en une seule paire
  de handlers sur le conteneur commun (`mouseenter`/`mouseleave` ne bubblent pas, mais les
  deux éléments étant frères dans un même wrapper, un seul binding sur le wrapper couvre
  les deux). 8 fichiers appelants mis à jour (mécanique, même patron `bind-x` à chaque
  fois). Encore une fois piège output : propriété renommée `selectColor` (pas
  `onSelectColor`) pour matcher l'attribut existant `on-select-color`.
- **`promote-to-us`** : `require: "ngModel"` simplifié en `@Input() item`. `tg-check-permission`
  (encore une directive sans template, même famille que `tg-avatar`/`tg-loading`/`tg-autofocus`)
  répliqué en ligne via `tgProjectService` plutôt que wrappé - seule valeur de permission
  utilisée par les deux appelants (`"add_us"`), donc codée en dur plutôt qu'exposée comme
  nouvel input pour une flexibilité que rien n'utilise aujourd'hui. **⚠️ Utilisait
  `AJS_RESOURCES`, corrigé vers `AJS_TG_RESOURCES`** - voir ci-dessous.
- **`tag`** : nouveau pipe partagé `tgEmojify` (`src/app/shared/emojify.pipe.ts`) pour le
  filtre AngularJS `emojify` (remplace les codes emoji par des `<img>`, via `$tgEmojis`) -
  réutilisable pour tout futur module affichant du texte utilisateur. Un seul fichier
  appelant réel (`tag-line-common.jade`, à l'intérieur d'un `ng-repeat` - fonctionne
  normalement, chaque itération instancie son propre composant downgradé). Les bindings
  `&` sans argument (`isArchived()`, `hasPermissions()` côté appelant) sont simplifiés en
  `@Input()` booléens plutôt qu'en callbacks : `bind-is-archived="vm.isArchived()"` continue
  de réévaluer l'expression à chaque digest AngularJS via le `$watch` sous-jacent, donc
  reste tout aussi "vivant" que l'appel de fonction original.

Vérifié : build Angular propre (`strictTemplates`, première tentative - un bon signal vu le
nombre de références croisées entre ces composants), karma **448/448** (452 - 4 tests du
contrôleur `color-selector` supprimé), et absence de régression sur les pages déjà
vérifiées (`/`, `/discover`, `/discover/search`). Les neuf nouveaux composants vivent
principalement dans des pages projet (détail de ticket, admin, tableaux) qui nécessitent
une session authentifiée réelle contre un `taiga-back` - non vérifiables interactivement
dans cet environnement, comme `external-app`/`profile` précédemment.

### Correction : `$tgResources` vs `tgResources` (les paragraphes ci-dessus étaient faux)

En utilisant l'app pour de vrai (retour direct de l'utilisateur, pas un test synthétique),
`detail-nav` a levé une vraie erreur : `this.rs.userstories.getQueryParams is not a
function`. En creusant, la cause n'était pas un bug de l'app d'origine mais **une erreur
de ma part sur trois modules** (`wip-limit-selector`, `detail-nav`, `promote-to-us`).

Il existe **deux services de ressources distincts et sans rapport l'un avec l'autre** :

- **`tgResources`** (sans `$`, `app/modules/resources/resources.coffee`) : un agrégateur
  plus récent et volontairement limité - seulement `listInAllProjects`/`listAllInProject`/
  `listInEpic` pour `userstories`, par exemple. C'est le service derrière le token
  `AJS_RESOURCES`.
- **`$tgResources`** (avec `$`, `app/coffee/modules/resources.coffee`) : le service
  d'origine, complet, assemblé au démarrage de l'app (`module.run([...])`) à partir de
  **tous** les `$tgXxxResourcesProvider` de `app/coffee/modules/resources/*.coffee`. C'est
  lui qui porte `getQueryParams`/`getBacklog` (`userstories.coffee`),
  `promoteToUserStory` (`tasks.coffee`/`issues.coffee`), `wipLimitUpdate`/`editStatus`
  (`swimlanes.coffee`/`userstories.coffee`).

Mon grep initial pour vérifier si `"$tgResources"` était enregistré n'a pas cherché dans
`app/coffee/modules/resources.coffee` (probablement parce que le nom du fichier, sans
`s` final dans "resources" au bon endroit, ne correspondait pas au motif que j'utilisais) -
j'ai donc conclu à tort que `$tgResources` était un nom cassé/une faute de frappe
répétée, alors qu'il s'agissait du **bon** service depuis le début, différent de celui que
j'ai injecté à la place.

**Corrigé** : nouveau token `AJS_TG_RESOURCES` (`src/app/shared/ajs-tokens.ts`, mappé sur
`"$tgResources"`), et les trois composants (`wip-limit-selector`, `detail-nav`,
`promote-to-us`) utilisent maintenant celui-là au lieu de `AJS_RESOURCES`. `AJS_RESOURCES`
reste défini et enregistré (`tgResources` est un vrai service, juste pas celui dont ces
trois-là avaient besoin) - potentiellement utile pour un futur module qui voudrait
spécifiquement la version allégée.

**Leçon pour la suite** : un grep qui revient bredouille prouve seulement qu'*un* motif de
recherche n'a rien trouvé, pas que le nom n'existe nulle part - en particulier avec deux
arborescences `resources.coffee` / `resources/*.coffee` qui se ressemblent. Avant de
conclure à un bug de l'app et de "corriger" un nom de service, vérifier avec plusieurs
formulations de grep (`$` échappé, avec/sans le dossier `resources/`) et, si possible,
avec un vrai clic dans un navigateur plutôt qu'une simple compilation propre - c'est
exactement ce qui a permis de détecter celui-ci.

### Troisième lot de leafs en place (5 modules)

Cinq composants de plus, même patron "leaf en place", résumés ensemble.

- **`history-entry`** : `tg-avatar` (encore une directive sans template, même famille que
  `tg-loading`/`tg-autofocus`/`tg-check-permission`) répliqué en ligne via `tgAvatarService`.
  L'original contenait un `ng-alt="{{entry.user.name}}"` - pas un vrai attribut AngularJS
  (aucune directive ne s'appelle `ngAlt`), donc un no-op sans effet - omis comme le reste du
  balisage mort déjà rencontré ailleurs.
- **`user-timeline-attachment`** : l'original choisissait entre deux templates au moment du
  link via `$compile` + `$tgTemplate.get(...)` selon que la pièce jointe est une image -
  remplacé nativement par `*ngIf`/`*ngIf; else`. **Bug de l'original reproduit
  fidèlement** : `isImage()` calculait `url.indexOf(extension, url - extension.length)` -
  soustraire un nombre d'une chaîne donne `NaN`, et `indexOf` traite un `fromIndex` `NaN`
  comme `0`, donc malgré l'air d'un test "se termine par", le code vérifie en réalité si
  l'extension apparaît *n'importe où* dans l'url. Reproduit tel quel via `.includes()` (le
  comportement réel, pas celui que le code a l'air de viser).
- **`move-to-sprint`** : nouveau token `AJS_LIGHTBOX_FACTORY` (`tgLightboxFactory`). Point
  d'attention : `lightboxFactory.create(name, attrs, scopeAttrs)` construit un nouveau scope
  AngularJS à partir de `scopeAttrs` puis pose `attrs` comme attributs HTML littéraux sur
  l'élément compilé - `attrs.sprint = "sprint"` est l'*expression* `"sprint"` évaluée contre
  ce nouveau scope, pas une valeur littérale. L'appel est reproduit à l'identique pour que
  `tg-lb-move-to-sprint` (une lightbox non touchée, toujours AngularJS) continue de
  fonctionner sans modification.
- **`suggest-add-members`** : `@Output()`s nommés `inviteSuggested`/`inviteEmail` (pas
  `onInviteSuggested`/`onInviteEmail`) pour matcher les attributs existants
  `on-invite-suggested`/`on-invite-email` du seul appelant - même piège que partout ailleurs
  dans cette migration.
- **`attachments-simple`** : `tg-attachments-drop` et `tg-file-change` (deux directives sans
  template, même famille que `tg-avatar`) répliquées en `(dragover)`/`(dragleave)`/`(drop)`/
  `(change)` natifs. Nouveau token `AJS_ATTACHMENTS_SERVICE` (`tgAttachmentsService`).
  L'original gardait `if @.onAdd`/`if @.onDelete` avant d'émettre puisqu'un binding `&`
  AngularJS peut rester non fourni - un `@Output()` Angular existe toujours, `.emit()` sans
  auditeur est déjà un no-op équivalent, donc la garde est omise.

Trois nouveaux pipes partagés au passage : `tgMomentFormat` (`moment-format.pipe.ts`, wrap du
filtre `momentFormat`), `tgMarkdownToHtml` (`markdown-to-html.pipe.ts`, wrap de
`tgWysiwygService.getHTML()` - nouveau token `AJS_WYSIWYG_SERVICE`), `tgSizeFormat`
(`size-format.pipe.ts`, wrap de l'utilitaire global `taiga.sizeFormat`).

Vérifié : build Angular propre (`strictTemplates`), karma **433/433** (437 - 4 tests des
specs de contrôleur/directive supprimés), et absence de régression sur `/` (page d'accueil
rechargée en Chrome headless, session simulée via `localStorage.setItem('userInfo', ...)`,
zéro erreur console/exception JS). Les cinq nouveaux composants vivent dans des zones
profondément imbriquées (historique de ticket, timeline utilisateur, résumé de sprint,
invitation de membres, pièces jointes d'epic/ticket) qui nécessitent une session
authentifiée réelle contre un `taiga-back` pour être exercées au-delà de la compilation -
non vérifiables interactivement dans cet environnement, comme les lots précédents.

### Quatrième lot (14 modules migrés sur 30 visés — voir plus bas pourquoi)

Demande initiale : 30 modules. Quatorze ont été migrés avec le même niveau de rigueur que
les lots précédents ; les autres candidats explorés ont été écartés après inspection
détaillée (pas juste "trop dur", une vraie raison technique à chaque fois) — détaillé en
fin de section, pour que la prochaine session ne re-découvre pas les mêmes impasses.

**Migrés :**

- **`contact-project-button` / `like-project-button` / `watch-project-button`** : trois
  boutons d'action du header projet, migrés ensemble (même appelant, `project.jade`).
  Nouveaux tokens `AJS_LIKE_PROJECT_BUTTON_SERVICE`/`AJS_WATCH_PROJECT_BUTTON_SERVICE`.
  `tg-loading` (compteur de likes/watchers) remplacé par un simple `*ngIf`/`else` sur le
  compteur plutôt que la substitution de contenu jQuery d'origine.
- **`blocked-project-explanation`** : la directive d'origine n'avait *aucun* scope isolé
  (lisait `vm.project` directement sur le scope parent) — rendu explicite via
  `@Input() project`, l'appelant passe maintenant `bind-project`.
- **`cant-own-project-explanation`** : un seul paragraphe statique traduit, aucun binding.
- **`history-tabs`** : directive sans controller. `ng-class="{'new-first': top, ...}"`
  référençait un `top` qui n'a jamais fait partie du scope — reproduit tel quel (toujours
  faux) plutôt que "corrigé".
- **Famille `tag-dropdown` / `tag-line-common` / `tag-line-detail`** : migrée d'un bloc
  puisque chacune dépend de la précédente. `tag-line-common` inline les deux `include` Jade
  de l'original (`add-tag-button`, `add-tag-input` — les includes Jade sont une composition
  *compile-time*, sans équivalent Angular). Utilise nativement `tg-tag` et
  `tg-color-selector` (déjà migrés) — premier cas de composants Angular s'appelant
  directement entre eux sans passer par le pont downgrade. `tag-dropdown` : `strict` dans
  `filter:tag.name:strict` n'était jamais déclaré sur le scope (toujours `undefined`/faux) —
  le filtre AngularJS n'a donc jamais tourné en mode strict, reproduit en filtrage
  substring insensible à la casse.
- **`terms-of-service-and-privacy-policy-notice`** : `target` était un vrai binding
  bidirectionnel (`"="`) — gardé en binding Angular bidirectionnel réel
  (`bindon-target`).
- **`attachment` / `attachment-gallery`** : deux directives distinctes partageant un seul
  controller AngularJS — gardées comme une seule classe de base `AttachmentBaseComponent`
  (nécessite son propre `@Directive()` pour que l'injection de dépendances fonctionne à
  travers l'héritage) plutôt que de dupliquer la logique. `tg-attachment-link` et
  `tg-auto-select` répliqués en ligne (même famille que tg-avatar/tg-loading) ;
  `auto-select.directive.coffee` lui-même **n'a pas été supprimé** — encore utilisé
  directement par 3 autres templates AngularJS.
- **`invite-members-form` + `lightbox-add-members-warning-message`** : le `onSendInvites`
  (`&`) déclaré dans le binding d'origine n'était **jamais invoqué** nulle part — code mort
  préexistant, reproduit tel quel (output déclaré mais jamais émis) plutôt que corrigé ou
  supprimé silencieusement. Deux appelants distincts trouvés pour le warning-message
  (`app/modules/invite-members/` et `app/partials/admin/`), tous deux mis à jour.

Vérifié : build Angular propre, karma **408/408**, page d'accueil rechargée en Chrome
headless sans erreur console.

**Écartés après inspection (pas de simple "trop dur" — la raison technique précise, pour
éviter de re-perdre du temps dessus plus tard) :**

- **`dropdown-project-list`, `dropdown-user`** : templates saturés de `tg-nav` (5 à 8
  usages chacun) — la directive de navigation jQuery à fort rayon d'impact, déjà exclue du
  périmètre de cette migration (voir plus haut, "trop complexe/fondamental").
- **`profile-bar`, `profile-contacts`, `profile-projects`, `user-timeline`/
  `user-timeline-item`** : même dépendance à `tg-nav` dans leur propre template.
- **`profile-favs`** (liked/voted/watched) : dépend de `infinite-scroll` (lib tierce
  ngInfiniteScroll) et de `tg-fav-item` (directive enfant non migrée) — les deux
  nécessiteraient un wrapper `UpgradeComponent` dédié, hors périmètre d'un simple leaf.
- **`epic-row`, `story-row`, `related-userstory-row`** : chacune utilise `tg-nav` pour son
  propre lien de clic vers la page de détail — pas juste une dépendance annexe, le
  comportement central de la ligne.
- **`ticket-watchers`** : la directive utilise `scope: true` (scope enfant *non* isolé, pas
  isolate scope) et ses 4 appelants l'invoquent comme balise nue sans aucun attribut —
  elle lit `project`/`usersById` directement sur le scope ambiant hérité du contrôleur
  parent. Fondamentalement incompatible avec le modèle d'entrées explicites de
  `downgradeComponent` sans toucher aux contrôleurs des 4 pages de détail.
- **`assigned-to-inline`, `assigned-users-inline`, `assigned-to`, `assigned-users`** :
  exactement le même problème que `ticket-watchers` — `require: "ngModel"` sans scope
  isolé, lisant `$scope.project`/`$scope.usersById` ambiants.
- **`lb-select-user`** : `scope: true`, instanciée uniquement via
  `lightboxFactory.create(...)` par les 4 directives ci-dessus (elles-mêmes écartées) —
  la migrer exigerait de modifier leurs appels `lightboxFactory.create` sans pouvoir
  vérifier les 4 flux assign/watch de bout en bout dans cet environnement (pas de
  `taiga-back` réel).
- **`filter`** : sa directive sœur `tg-filter-slide-down` fait un `$('tg-filter')` — un
  sélecteur jQuery *global*, par nom de balise, sur tout le document — plus fragile encore
  que `tg-nav`. Contrôleur de 104 lignes + logique `ResizeObserver` de mise en page liée à
  une page taskboard spécifique.
- **`detail-header`, `project-menu`** : dépendent respectivement de `tg-due-date` (enfant
  non migré, demanderait un wrapper) et `tg-legacy-loader`/`tg-load-element` (un mécanisme
  de chargement dynamique de composant distinct, potentiellement un autre framework —
  jamais creusé en détail, juste repéré comme signal d'alarme suffisant pour reporter).

### Cinquième lot (15 modules migrés sur 40 visés)

Demande : 40 modules. Après les quatre lots précédents, le gisement de candidats "leaf"
propres (scope isolé, sans `tg-nav`, sans lib tierce) s'épuise nettement — beaucoup du
code restant est dans d'anciens fichiers "grab-bag" multi-directives
(`common/components.coffee`, `admin/memberships.coffee`, etc.) écrits *avant* que la
convention scope-isolé + bindToController ne se généralise, et qui lisent le scope ambiant
du contrôleur parent directement (même famille de blocage que `ticket-watchers`/
`assigned-*` déjà rencontrée). 15 modules ont quand même été migrés avec la même rigueur :

- **`lb-add-members`** (`tgLbAddMembers`) : scope isolé *vide* — le `"project"` passé par
  `lightboxFactory.create` n'était lu nulle part (ni controller ni template). Les deux
  enfants (`tg-suggest-add-members`, `tg-invite-members-form`) sont déjà des composants
  Angular — premier lightbox entièrement composé de composants déjà migrés.
- **`lb-display-historic`** (`tgLbDisplayHistoric`) : appelant (`comment.controller.coffee`,
  derrière `tgComment` non migré) mis à jour vers `bind-x`. Utilise `tg-history-entry`
  nativement.
- **`single-member` + `invite-members`** (`tgSingleMember`, `tgInviteMembers`) : la grille
  d'avatars à l'écran de création de projet.
- **`wiki-history-diff` + `wiki-history-entry`** (`tgWikiHistoryDiff`, `tgWikiHistoryEntry`) :
  le parent `tgWikiHistory` reste AngularJS (dépend de `infinite-scroll`, lib tierce, même
  blocage que `profile-favs`) mais ses deux enfants sont propres.
- **`newsletter-email-lightbox`** (`tgNewsletterEmailLightbox`) : l'original déclarait 4
  bindings (`visible`, `openNewsletter`, `onClose`, `onSelectUser`) dont *aucun* n'était
  jamais renseigné par le seul appelant réel — y compris un `ctrl.start()` mort (la
  directive n'avait même pas de `controller:`). Seul le comportement réellement vivant a
  été repris.
- **`lightbox-move-to-sprint`** (`tgLbMoveToSprint`) : la lightbox ouverte par
  `MoveToSprintComponent` (déjà migré) — son appel `lightboxFactory.create` mis à jour vers
  `bind-sprint`/`bind-open-items`.
- **`attachments-preview`** (`tgAttachmentsPreview`) : la prévisualisation plein écran des
  pièces jointes images. `tg-preload-image` (transclude, spinner-jusqu'à-chargement)
  remplacé par un flag `loading` piloté par l'événement natif `(load)` de l'`<img>`.
- **`no-more-memberships-explanation`** (`tgNoMoreMembershipsExplanation`) : même famille que
  `blocked-project-explanation`.
- **`duty`** (`tgDuty`) : ligne de ticket dans "working on"/"watching" sur la page d'accueil.
  Utilisée comme *attribut* dans l'original (`tg-duty="duty"` sur le même `div` que
  `is-hidden`/`type`) — `downgradeComponent` compile toujours en `restrict: 'E'`, donc les 4
  usages dans `working-on.jade` (toujours AngularJS) ont dû être restructurés en forme
  élément. `$scope.$emit` (remontée vers le parent) remplacé par
  `$rootScope.$broadcast` (un composant Angular n'a pas de `$scope` AngularJS pour émettre
  vers le haut ; `$on` ne distingue pas emit de broadcast).
- **`public-register-message`** (`tgPublicRegisterMessage`) : l'original utilisait
  `template: templateFn`, une fonction appelée une fois à la compilation retournant une
  chaîne HTML via un template underscore/lo-dash (pas des bindings AngularJS classiques) —
  simplifié en `*ngIf` + `url` calculé, plus simple que l'original.

Vérifié : build Angular propre à chaque étape, karma **391/391**, page d'accueil rechargée
en Chrome headless sans erreur console après le changement le plus risqué (`duty`, qui
restructure le DOM de 4 sites d'appel).

**Trouvé et confirmé mort : `tribe-linked`** (`tgTribeLinked`,
app/modules/components/tribe-button/tribe-linked.*) — zéro appelant nulle part dans l'app.
Pas migré, à nettoyer un jour.

**Écartés après inspection :**

- **`history` / `history-diff`** (`tgHistory`/`tgHistoryDiff`, le vrai "activity log" —
  différent de `history-entry` déjà migré) : `history-diff.jade` fait `include` sur
  **20 sous-templates séparés** (un par type de champ modifié : points, statut, tags,
  assignation, etc.). Portage faisable mais disproportionné pour ce qui ne compterait que
  pour 2 modules — reporté à une passe dédiée.
- **`lb-feedback`** (`tgLbFeedback`) : utilise `checksley` (validation tierce), même
  exclusion que `create-epic`.
- **`create-project-form`, `duplicate-project`** (`tgCreateProjectForm`,
  `tgDuplicateProject`) : dépendent de `tg-create-project-restrictions`/
  `tg-create-project-members-restrictions`, non explorées en détail — seul leur usage de
  `tg-invite-members` (migré) a été mis à jour dans `duplicate-project.jade`.
- **`belong-to-epics`, `sprint` (backlog)** : identifiés comme candidats plausibles
  (scope isolé, pas de dépendance connue à `tg-nav`) mais non explorés en détail faute de
  temps dans cette passe — bons points de départ pour la suite.

### `tg-nav` version Angular (débloque les modules qui en dépendaient dans leur propre template)

Jusqu'ici, tout module dont le *propre* template utilisait `tg-nav` était systématiquement
écarté (`dropdown-project-list`, `dropdown-user`, `profile-bar`, `profile-contacts`,
`profile-projects`, `user-timeline-item`, `epic-row`, `story-row`,
`related-userstory-row`, `dropdown-notifications`, `highlighted`...) — `tg-nav` étant une
directive AngularJS jQuery-lourde à fort rayon d'impact (calcul paresseux d'URL au
survol, interception de clic, DSL de chaîne parsée à la main), jugée trop risquée à
toucher directement.

**Ce qui a été fait** : une **nouvelle** directive Angular `TgNavDirective`
(`src/app/shared/tg-nav.directive.ts`), écrite from scratch, PAS un wrapper de
l'ancienne. L'ancienne `tg-nav` AngularJS reste **intouchée** et continue de fonctionner
exactement comme avant pour tous les templates encore AngularJS. La nouvelle directive
Angular est additive : elle sert uniquement depuis les templates des *nouveaux* composants
Angular, pour qu'un leaf n'ait plus à rester AngularJS uniquement à cause d'un lien de
navigation.

**Aucun changement du routing** : ngRoute reste seul maître de toutes les routes.
`TgNavDirective` résout les URLs via les mêmes services existants (`$tgNavUrls`,
`$tgSections`, injectés via le pont de tokens) et navigue via `$tgLocation` — la même
mécanique que l'original, juste appelée depuis Angular.

**Convention d'appel différente, volontairement** : le DSL de chaîne de l'original
(`tg-nav="project:project=vm.x,section=vm.y"`, parsé à la main puis `$scope.$eval`'d)
n'a pas d'équivalent Angular — Angular n'a pas de mécanisme pour évaluer une expression
arbitraire depuis un attribut texte, et en réimplémenter un aurait juste été un `$parse`
maison de moins bonne qualité. À la place, deux inputs Angular ordinaires :

```html
<a [tgNav]="'project'" [tgNavParams]="{project: x.slug, section: y}">
```

Comportement conservé : suffixe de route `project` via `$tgSections.getPath(...)`, ajout
automatique du `user` courant aux params, vrai `href` posé sur les balises `<a>` (survol/
clic-droit/nouvel onglet fonctionnent nativement), clic principal → navigation via
`$tgLocation` + fermeture des lightboxes, clic milieu → nouvel onglet, meta/ctrl-clic
laissé au navigateur, classe `.noclick` toujours respectée.

**Simplification volontaire** : calcul de l'URL fait de façon eager (`ngOnChanges`) plutôt
que paresseuse au `pointerenter` comme l'original (une optimisation perf pour les grosses
listes) — plus simple et idiomatique côté Angular ; à revisiter seulement si un vrai souci
de perf apparaît sur une grosse liste.

**Preuve de concept** : `profile-bar` (`tgProfileBar`), écarté dans le lot précédent
précisément pour cette raison, a été migré avec succès en utilisant
`[tgNav]="'user-settings-user-profile'"`. Nouveaux tokens `AJS_AUTH` (`$tgAuth`) et
`AJS_SECTIONS` (`$tgSections`).

**Limite de vérification** : la page profil elle-même dépend d'un vrai backend pour son
`resolve` de route (même limitation déjà rencontrée pour les autres pages de détail
authentifiées) — build et karma vérifiés propres, zéro erreur console en naviguant vers la
page, mais le clic de navigation lui-même n'a pas pu être vérifié interactivement dans cet
environnement.

**Pour la suite** : les modules listés au premier paragraphe (`dropdown-project-list`,
`profile-contacts`, `profile-projects`, `epic-row`, `story-row`,
`related-userstory-row`, `dropdown-notifications`, etc.) sont maintenant candidats à une
migration en suivant ce même patron.

### Deux pièges trouvés en vérifiant `dropdown-project-list`/`dropdown-user` en direct

Ces deux modules (débloqués par `tg-nav`, voir section précédente) sont passés le build et
karma sans problème, mais une vérification en navigateur réel (Chrome headless, profil
neuf) a révélé deux soucis que les checks statiques ne pouvaient pas voir :

1. **Attribut vs élément, encore** : `tg-dropdown-project-list` était utilisé comme
   *attribut* sur `.topnav-dropdown-wrapper` (`.topnav-dropdown-wrapper(ng-if="..."
   tg-dropdown-project-list active="...")` — en Jade, un identifiant nu à l'intérieur des
   parenthèses `(...)` d'un élément est un attribut de *cet* élément, pas un nouvel élément)
   et `tg-dropdown-user` comme attribut sur un `div` nu (`div(tg-dropdown-user)`).
   `downgradeComponent` compile toujours en `restrict: 'E'` (élément uniquement) — les deux
   composants ne rendaient donc **rien du tout**, silencieusement, sans erreur console.
   Repéré uniquement en cherchant l'élément dans le DOM réel après connexion simulée. Même
   catégorie d'erreur que `tg-duty` plus tôt — **toujours vérifier la forme d'appel
   (élément vs attribut) en lisant le Jade avec attention, pas juste "ça a l'air d'un tag
   sur sa propre ligne"**, et si possible confirmer par une vraie recherche DOM en
   navigateur plutôt que par la seule lecture du Jade.

2. **AngularJS tolère `undefined.taille`, Angular non** : `currentUserService.projects`
   reste un `Immutable.Map()` vide tant qu'un vrai fetch de projets n'a pas eu lieu (par
   exemple juste après connexion, avant qu'une resolve de route ne charge les projets).
   `vm.projects.size` dans un template AngularJS ne lève jamais si `vm.projects` est
   `undefined` (évaluation d'expression permissive par défaut) — mais dans un template
   Angular strict, la même chaîne fait planter le rendu (`Cannot read properties of
   undefined (reading 'size')`). Ce n'est pas un bug introduit par le portage : c'est un
   vrai écart de permissivité entre les deux frameworks qu'il faut combler explicitement
   (ici, `|| Immutable.List()` dans le getter) à chaque fois qu'une valeur peut être lue
   avant qu'un service asynchrone ne l'ait remplie.

**Leçon pour la suite** : pour tout module débloqué par `tg-nav`, une vérification en
navigateur réel (pas seulement build + karma) est nécessaire avant de committer — ces deux
classes de bugs ne remontent dans aucun des deux.

### Sixième lot : 10 modules débloqués par `tg-nav`, et pourquoi `user-timeline-item` ne l'est pas

Suite à l'ajout de `TgNavDirective` (section précédente), 10 des modules qu'elle débloquait
ont été migrés dans la foulée, chacun vérifié en navigateur réel (pas seulement build +
karma) : `profile-bar`, `dropdown-project-list`, `dropdown-user`, `profile-contacts`,
`profile-projects`, `dropdown-notifications`, `belong-to-epics`, `story-row`, `epic-row`,
`related-userstory-row`. Détails et bugs trouvés dans les commits individuels et la
section précédente (piège attribut-vs-élément, écart de permissivité AngularJS/Angular).

**`user-timeline-item` reste bloqué, pour une raison différente et plus profonde.** Son
template utilise `tg-compile-html` (app/coffee/modules/common/compile-html.directive.coffee) :
`element.html(newValue); $compile(element.contents())(scope)` — ça prend une chaîne HTML et
la fait *compiler* par AngularJS contre le scope courant, exécutant tout directive/binding
qu'elle contient. Le contenu compilé
(`timeline.get('title_html')`, calculé côté client par
`user-timeline-item-title.service.coffee`) contient un **vrai `tg-nav` fonctionnel intégré**
généré dynamiquement, par ex. `<a tg-nav="project-issues-detail:project=timeline.getIn([...]),ref=timeline.getIn([...])">`
— la MÊME syntaxe DSL en chaîne que l'ancien `tg-nav`, à évaluer contre le scope au moment
de la compilation.

Un simple `[innerHTML]` Angular ne compile RIEN de ce qui est injecté — l'attribut
`tg-nav` intégré resterait totalement inerte (pas de href calculé, aucun clic
fonctionnel). Pour porter ça fidèlement il faudrait soit :
- appeler `$compile` manuellement depuis le composant Angular (récupérer le service
  AngularJS, compiler la chaîne contre un scope construit à la main, insérer le noeud DOM
  résultant) — un pont bien plus invasif que tout ce qui a été fait jusqu'ici, ou
- réécrire `user-timeline-item-title.service.coffee` pour qu'il retourne des données
  structurées (nom de route + params) plutôt qu'une chaîne HTML avec un `tg-nav` intégré —
  ce qui dépasse le périmètre d'un simple leaf et touche un service partagé avec
  `notifications.service.coffee`.

Les deux options représentent un effort et un risque disproportionnés par rapport à un
seul module — reporté plutôt que tenté sous pression de temps avec un résultat
probablement cassé. Repéré aussi en passant : `tg-user-timeline-title` (utilisé dans le
même template) ne correspond à aucune directive enregistrée nulle part — mort, comme
`tg-related-userstories-create-form` trouvé plus tôt.

### Phase 1 (feuille de route post-63-modules) : bug critique dans `lightboxFactory`, puis `tgLbContactProject`

Avant de commencer le premier candidat de la Phase 1 (`tgLbContactProject`), un vrai bug de
production a été découvert et corrigé : `LightboxFactory.create()`
(`app/modules/services/lightbox-factory.service.coffee`) construisait un
`<div>` avec le nom de la directive posé comme **attribut** (`$("<div>").attr(name, true)`)
pour ouvrir n'importe quel lightbox. Or `downgradeComponent` (`@angular/upgrade`) compile
toujours avec `restrict: 'E'` — il ne matche que sur le nom de balise, jamais sur un
attribut. Résultat : **tout lightbox déjà migré en composant Angular downgradé et ouvert via
cette factory ne montait plus rien**, silencieusement (aucune exception, build et karma
restaient verts). Trois modules déjà committés étaient concernés :
`lightbox-move-to-sprint`, `newsletter-email-lightbox`, `lightbox-display-historic`.

Corrigé en construisant l'élément comme `<name>` (la balise propre de la directive) plutôt
qu'un `<div>` porteur de l'attribut. Les directives AngularJS classiques ont par défaut
`restrict: 'EA'` (aucun des appelants de cette factory ne restreint à `'A'` seul), donc leur
comportement est inchangé. Vérifié en navigateur headless (profil neuf) : un lightbox non
migré (`tg-lb-feedback`) s'ouvre toujours normalement, et les trois lightboxes downgradés
affectés rendent maintenant tout leur contenu ; les 367 specs karma restent vertes.
**Leçon pour la suite** : toute nouvelle migration de lightbox ouvert via `lightboxFactory`
doit être vérifiée en navigateur réel, pas seulement build+karma — ce bug n'aurait jamais
été détecté autrement.

`tgLbContactProject` → `LightboxContactProjectComponent` migré ensuite, downgradé sous le
même sélecteur. La directive d'origine n'avait pas de `scope: {}` explicite à côté de
`bindToController: {project: '='}` — combinaison inhabituelle mais qui fonctionne, confirmée
via son seul appelant réel (`ContactProjectButtonComponent`, déjà Angular), dont les attrs de
`lightboxFactory.create` passent de `project: "project"` à `"bind-project": "project"`.
`tg-lightbox-close` et `tg-project-logo-big-src` (tous deux sans template) répliqués en
ligne, même patron que les lightboxes/composants profile précédents. La première branche du
template original (`ng-if="vm.project.logo_big_url"`, lecture directe d'une propriété plate
sur une Map Immutable) était du code mort — seule la branche `tg-project-logo-big-src` a
jamais été rendue, donc seul ce comportement est répliqué.

Un second bug du même genre a été découvert juste après, en vérifiant `tgLbContactProject`
en navigateur réel : `LightboxMoveToSprintComponent`, `LightboxDisplayHistoricComponent`,
`LightboxAddMembersComponent` et `LightboxContactProjectComponent` (donc quatre modules,
dont trois déjà committés dans des lots précédents) omettaient tous un appel que leur
directive AngularJS d'origine faisait directement dans son `link` :
`lightboxService.open(el)`. C'est cet appel qui rend le lightbox visible (ajoute la classe
`.open`, passe `display` à `flex` — la classe `.lightbox` est `display: none` par défaut) ;
sans lui, ces quatre lightboxes rendaient bien leur contenu (build/karma verts, contenu
visible en inspection DOM) mais restaient invisibles à l'écran en usage réel. Seul
`NewsletterEmailLightboxComponent` (migré dans le même lot que deux des quatre) faisait ça
correctement. Corrigé en ajoutant `this.lightboxService.open($(this.elementRef.nativeElement))`
dans le constructeur des quatre — vérifié en audit systématique (recherche dans l'historique
git de chaque directive supprimée qui appelait `lightboxService.open`) qu'aucun autre module
n'a le même trou ; `tg-attachment-link` utilise ce même appel mais dans un pattern différent
et non affecté (ouvre un élément statique séparé depuis un click handler, pas lui-même).
**Leçon** : pour du code de lightbox, une vérification de rendu ne suffit pas — il faut
aussi vérifier que l'élément devient réellement visible (`.open` + `display`), pas
seulement qu'il a du contenu.

`tgLbImportError` → `LightboxImportErrorComponent` migré ensuite. La directive d'origine
n'avait aucun `scope:` (scope ambiant), mais son seul appelant réel
(`import-project.service.coffee`) passe toujours la même forme fixe
(`{key, values: {max_memberships, members}}`), répliquée en deux `@Input()` plutôt qu'un
refactor de scope ambiant plus large. `lightboxService.open(el)` répliqué dès le
constructeur (leçon du bug précédent). Repéré mais volontairement non touché : deux des six
branches `ng-switch` traduisent une clé locale (`PROJECT_MEMBERS_DESC`) qui n'existe pas
dans `locale-en.json` (les vraies clés sont suffixées `_PRIVATE`/`_PUBLIC`) — bug préexistant
sans lien avec la migration, confirmé pour dégrader de la même façon (clé brute affichée)
avant et après.

### Phase 2, sous-projet 1 : dragula → @angular/cdk/drag-drop — premier module (`tgSortProjects`)

Un audit complet des 10 usages de `dragula` dans le code (voir `MIGRATION_ROADMAP.md`) a
montré que ce n'est pas un bloc homogène : `tgSortProjects` (scope isolé, un seul appelant,
un seul conteneur, pas de `window.dragMultiple`) était le seul candidat immédiat ; les
autres sont soit entangled avec un blocage de scope ambiant déjà connu, soit du drag
multi-conteneurs complexe (backlog/kanban/taskboard) qui reste un chantier séparé.

`@angular/cdk@17.3.10` ajouté (compatible avec `@angular/core@^17.3.0`), `DragDropModule`
importé dans `app.module.ts`. `tgSortProjects` → `SortProjectsComponent` : contrairement
aux migrations précédentes, ce n'est pas une simple substitution de directive — la
directive d'origine enveloppait une liste déjà existante (`ul`/`tg-repeat`) avec `dragula`
plutôt que de la posséder ; migrer cette liste vers `@angular/cdk/drag-drop` a donc demandé
d'internaliser **toute la liste** (le `ul` et ses `li`) dans le nouveau composant plutôt que
juste le wrapper de drag — même logique que `epic-row`/`story-row` qui possèdent déjà leur
propre liste d'enfants. Aucune tentative de downgrader les directives CDK elles-mêmes dans
un template AngularJS (technique jamais éprouvée dans ce projet, jugée plus risquée que
d'internaliser la liste).

**Bug réel trouvé et corrigé avant de committer** : `@angular/cdk/drag-drop` ne déplace pas
lui-même le DOM au drop (contrairement à `dragula`, qui manipule physiquement le nœud
déplacé pour un retour visuel instantané) — l'app est censée réordonner son propre tableau
lié dans `(cdkDropListDropped)`. Un premier essai appelait `moveItemInArray` sur une copie
jetable (`this.projects.toJS()`) sans jamais la réutiliser pour l'affichage : la commande
serveur (`bulkUpdateProjectsOrder`) partait avec les bonnes données, mais la liste affichée
revenait visuellement à l'ordre d'avant, sans retour optimiste. Corrigé en gardant une copie
locale mutable (`displayProjects`, rafraîchie depuis `@Input() projects` à chaque
changement) que `drop()` réordonne immédiatement pour le rendu, exactement comme le
comportement optimiste du `dragula` d'origine (la liste réelle se corrige d'elle-même dès
que le parent recharge et repasse un nouveau `@Input() projects`).

**Première vérification de ce type dans toute la migration** : comme ce module implique un
vrai geste utilisateur (pas juste du rendu statique), la vérification en navigateur headless
a simulé un vrai drag via CDP (`Input.dispatchMouseEvent`: `mousePressed` → plusieurs
`mouseMoved` → `mouseReleased` entre le 1er et le 3ème item) plutôt que de se contenter d'un
dump du DOM. Confirmé : l'ordre visuel change immédiatement après le drop, et
`bulkUpdateProjectsOrder` est appelé avec le payload `{project_id, order}` correctement
recalculé. Karma (367 specs) reste vert.

### Phase 2, sous-projet 1 (suite) : `tgAttachmentsSortable`

Deuxième module du remplacement de `dragula`. Comme `tgSortProjects`, la directive
d'origine (`app/modules/components/attachments-sortable/`) était un attribut ambiant
enveloppant une section déjà existante de `attachments-full.jade` (elle-même propriété de
`tgAttachmentsFull`, qui reste 100% AngularJS) plutôt que de la posséder — migrée en
internalisant toute la section `.attachment-list.sortable` (la liste triable de
`tg-attachment`, les placeholders de fichiers en cours d'upload non-triables, et le lien
"afficher/masquer les pièces jointes obsolètes" juste en dessous) dans le nouveau
`AttachmentsSortableComponent`, plutôt que de downgrader les directives CDK dans le
template AngularJS restant.

Différence notable avec `tgSortProjects` : `tgAttachmentsFullService.reorderAttachment`
réordonne déjà sa propre `Immutable List` interne de façon synchrone *avant* l'appel serveur
— donc `attachmentsVisible` (le `@Input()`, lié directement depuis ce service via le
contrôleur AngularJS parent) reflète déjà le nouvel ordre au digest suivant. Pas besoin
d'une copie locale optimiste façon `displayProjects` ici — juste une copie mutable
(`displayAttachments`, rafraîchie à chaque changement d'`@Input()`) pour que
`moveItemInArray` ait un tableau à réordonner pour `@angular/cdk/drag-drop`.

Les événements `delete`/`update` de `tg-attachment` (déjà migré) sont simplement
retransmis vers le haut via les `@Output()` du nouveau composant, puisque les méthodes
`deleteAttachment`/`updateAttachment` du contrôleur parent restent côté AngularJS. Le
`title` du lien "plus d'attachments" reste toujours `ATTACHMENT.SHOW_DEPRECATED` même une
fois basculé en mode "masquer" (seul le texte du `span` visible change) — bug préexistant
mineur, gardé tel quel, pas "corrigé".

Vérifié en navigateur headless (profil neuf) avec un vrai drag simulé (comme
`tgSortProjects`) ET un vrai clic sur le lien de bascule : la liste se réordonne
visuellement, l'événement `reorder` part avec le bon attachment et le bon index, et
l'événement `toggle` part au clic. Karma (367 specs) reste vert.

### Phase 2, sous-projet 1 (suite) : `tgRelatedUserstoriesSortable`

Troisième module. Même situation que les deux précédents : la directive d'origine
enveloppait la section `.related-userstories-body` de `related-userstories.jade`
(propriété de `tgRelatedUserstories`, dont le scope est en fait isolé et propre — bloqué
de la migration complète seulement par son enfant `tg-related-userstories-create`, encore
AngularJS, non audité ici) plutôt que de la posséder — migrée en internalisant uniquement
cette section (la liste triable de `tg-related-userstory-row`, déjà un composant Angular
d'un lot précédent) dans `RelatedUserstoriesSortableComponent`, en laissant le reste de
`related-userstories.jade` inchangé. Au passage, le `div(tg-related-userstories-create-form)`
en fin de template — déjà confirmé mort dans un lot précédent (aucune directive
enregistrée sous ce nom) — a été supprimé.

Deux vérifications de permission distinctes existaient dans l'original et sont gardées
distinctes ici plutôt que fusionnées : le `link` de la directive n'instanciait `dragula`
que si `projectService.hasPermission("modify_epic")` (vérifié une seule fois, pas de façon
réactive) — répliqué via `[cdkDropListDisabled]`, calculé une seule fois dans le
constructeur ; alors que la classe CSS `sortable` dépendait de `vm.userCanSort()`
(`projectService.canEdit("modify_epic")`, une méthode différente) - gardée comme un
`@Input()` séparé plutôt que de supposer que les deux vérifications sont interchangeables.

Comme `tgSortProjects` (et contrairement à `tgAttachmentsSortable`),
`epicsService.reorderRelatedUserstory` ne réordonne pas ses propres données avant l'appel
serveur - il recalcule les données d'ordre, appelle l'API, puis recharge toute la liste au
succès. Une copie locale mutable (`displayUserstories`) est donc réordonnée immédiatement
dans `drop()` pour le même retour visuel optimiste que `dragula` donnait gratuitement.

Vérifié en navigateur headless (profil neuf) avec un vrai drag simulé entre le 1er et le
3ème item (permissions forcées à `true` sur le service stubé pour permettre le test) : les
3 lignes se rendent, l'événement `reorder` part avec la bonne userstory et le bon index,
aucune erreur console. Karma (367 specs) reste vert.

### Phase 2, sous-projet 1 (suite) : `tgEpicsSortable`

Quatrième module. Cas un peu différent des trois précédents : la directive d'origine
enveloppait `.epics-table-body-row` à l'intérieur de `.epics-table-body`
(`epics-table.jade`) — mais ce MÊME `div` extérieur porte aussi `infinite-scroll`
(`ngInfiniteScroll`), un blocage Phase 2 **différent et pas encore traité** (item 4 de la
feuille de route). Plutôt que d'y toucher, `EpicsSortableComponent` n'internalise que la
liste de lignes elle-même (déjà `tg-epic-row`, un composant Angular d'un lot précédent) et
reste imbriqué À L'INTÉRIEUR du `.epics-table-body` d'origine, qui garde son
`infinite-scroll` intact côté AngularJS.

Même double vérification de permission que `tgRelatedUserstoriesSortable` (gate de
`dragula` via `hasPermission("modify_epic")`, une seule fois au link — répliqué via
`[cdkDropListDisabled]` calculé une fois au constructeur). Comme `tgAttachmentsSortable`,
`epicsService.reorderEpic` réordonne déjà sa propre `Immutable List` avant l'appel serveur
— `displayEpics` n'est qu'une copie mutable pour `moveItemInArray`, pas un correctif de
retour optimiste.

Vérifié en navigateur headless (profil neuf) avec un vrai drag simulé : l'événement
`reorder` part avec le bon epic et le bon index. Une erreur de test isolée (non liée à ce
composant) a été creusée avant d'être écartée : `tg-epic-row` (déjà migré dans un lot
antérieur) lit `projectService.project.toJS()` dans son `ngOnChanges` — un premier essai
appelait `projectService.setProject(...)` puis compilait immédiatement dans le même script
synchrone, et les composants Angular imbriqués (créés de façon asynchrone par
`downgradeComponent`) se sont initialisés avant que l'affectation soit visible, journalisant
une exception ponctuelle. Confirmé sans lien avec `EpicsSortableComponent` en relançant le
même test avec le projet déjà défini au préalable : rendu propre, aucune erreur. Karma
(367 specs) reste vert.

### Phase 2, sous-projet 1 (suite) : scoping du gros chantier backlog/kanban/taskboard, puis `tg-card`

Après les 4 modules "quick win", seul restait le "gros chantier" (backlog/kanban/
taskboard), scopé en détail via un audit du code (voir `MIGRATION_ROADMAP.md` pour le
tableau complet). Deux corrections importantes sont survenues pendant le scoping :

1. L'hypothèse initiale ("le backlog ne dépend pas de `tg-card`, c'est le point de départ
   le plus simple") s'est révélée fausse à la lecture de `backlog-row.jade` : la ligne de
   backlog appelle `tg-us-status`, `tg-backlog-us-points`, `tg-us-edit-selector` — aucun
   migré, et `tg-us-status` confirmé ambiant/`$compile` manuel (même famille bloquée que
   Phase 1/3). La directive d'origine exige aussi explicitement `$scope.ctrl`
   (`BacklogCtrl`, gros contrôleur non-Immutable). Séquence corrigée avec l'utilisateur :
   `tg-card` d'abord (prérequis partagé kanban+taskboard, projet autonome déjà bien
   scopé), puis taskboard, puis kanban, le backlog en dernier une fois ses propres
   blocages levés.
2. Décision actée avec l'utilisateur : `window.dragMultiple` (sélection multiple + glisser
   groupé, backlog+kanban) sera reconstruit plus tard dans un sous-projet séparé — les
   migrations suivantes acceptent une régression UX temporaire (un item à la fois).

`tg-card` migré ensuite → `CardComponent` (+ `CardSlideshowComponent` séparé pour
`tg-card-slideshow`, migré en même temps car trivial et utilisé nativement par
`CardComponent`). Le plus gros composant de toute cette migration à ce jour : l'original
tenait sur 12 fichiers (~1193 lignes) à cause d'un contournement AngularJS particulier —
5 des 8 sous-templates (`card-tags`/`card-epics`/`card-title`/`card-tasks`/`card-unfold`)
étaient de vrais `include` Jade (compilés dans le même scope que le contrôleur, inlinés
directement dans le nouveau template Angular, même logique que `wiki-history-entry`
inlinant `history-attachments`), mais les 3 autres (`tgCardAssignedTo`/`tgCardData`/
`tgCardActions`, dans `kanban/main.coffee`) étaient de VRAIES directives AngularJS
séparées qui construisaient du HTML à la main via `_.template()` (un fichier `.jade` qui
est en réalité de l'EJS, pas du vrai Jade) et l'injectaient avec `$el.html(html)` — ce
contournement disparaît entièrement, remplacé par du templating Angular standard
(`*ngIf`/`*ngFor`/bindings).

**`getLinkParams()` (utilisé par `card-title.jade` pour `tg-nav-get-params`)** remontait la
chaîne de scope AngularJS (`taiga.findScope`) pour trouver le `KanbanController` parent et
lire `lastLoadUserstoriesParams`/`scope.swimlanesList`, afin de préserver le contexte
swimlane/filtre du kanban en naviguant vers une US puis en revenant. Un vrai composant
Angular n'a pas cette chaîne de scope à remonter : devenu un `@Input() linkParams`
explicite — une nouvelle méthode `getCardLinkParams(item)` ajoutée directement au
`KanbanController` (qui a déjà accès direct à ces données, pas besoin de remonter quoi que
ce soit) calcule la même chose, et l'appelant kanban la passe en binding ; l'appelant
taskboard ne la passe pas du tout (son contrôleur n'a jamais eu l'équivalent non plus, le
scope-walk serait de toute façon retombé sur `{}`).

**Code mort trouvé et non répliqué** : `onClickRemove` (déclaré dans le `bindToController`
d'origine mais jamais câblé par aucune des 3 directives, jamais lu par le contrôleur,
jamais passé par aucun appelant) — omis entièrement. Le calcul `avatars` de
`card-data.jade` (bâti par l'ancienne `CardDataDirective`) n'est en fait jamais référencé
dans le template lui-même — confirmé mort, non répliqué. `hasMultipleAssignedUsers()` est
aussi inutilisé par tout template mais était une vraie méthode du contrôleur (contrairement
à `onClickRemove`, jamais implémenté) — gardée pour fidélité.

**Bug réel trouvé et corrigé avant de committer** : `openActionsPopup()` capturait
`event.currentTarget` dans une closure (le callback de fermeture du popover, exécuté plus
tard) — mais `Event.currentTarget` redevient `null` une fois la phase de dispatch de
l'événement terminée, donc le callback différé plantait. Corrigé en capturant l'élément
bouton lui-même dans une variable locale avant l'appel à `taiga.globalPopover`, réutilisée
telle quelle dans le callback de fermeture plutôt que de relire `event.currentTarget`.

Vérifié en navigateur headless (profil neuf) avec un scénario complet : rendu des tags,
epics, avatars multiples (aperçu + badge "+N"), points, date d'échéance, statistiques de
tâches, ouverture du menu d'actions (clic réel sur le bouton "..."), clic sur "Edit" dans
le menu (vérifie l'événement `clickEdit`), et bascule du fold — tout correct, aucune
erreur console sur un profil Chrome neuf. **Leçon reconfirmée** : deux fausses pistes
d'erreurs sont apparues en réutilisant le même processus Chrome sur plusieurs vérifications
manuelles successives (le même piège déjà documenté plus haut) — un profil neuf à chaque
vérification les a fait disparaître. Karma (361 specs, -6 après suppression des 3 anciennes
directives + leur spec) reste vert.

**Second bug réel trouvé après coup** (pas pendant la vérification initiale, repéré en
préparant la migration de `tgTaskboardSortable`) : les appelants kanban/taskboard de
`tg-card` (`on-toggle-fold`/`on-click-edit`/`on-click-delete`/`on-click-assigned-to`)
avaient gardé leur syntaxe `&` d'AngularJS d'avant-migration (locaux bruts, ex.
`on-click-edit="ctrl.editUs(id)"`). Ça ne fonctionnait que parce que le binding `&`
d'AngularJS invoque l'expression avec l'objet de locaux passé tel quel par la directive —
`downgradeComponent` fonctionne différemment : confirmé directement dans le code source
d'`@angular/upgrade` qu'il invoque toujours l'expression appelante avec
`getter(scope, {'$event': valeur})`, sans jamais étaler les clés de l'objet émis. `id`
était donc `undefined` dans les 4 appelants, sur kanban ET taskboard, rendant clic sur
plier/éditer/supprimer/assigner silencieusement inopérants depuis le commit `tgCard`.
Corrigé en utilisant `$event.id`, même convention que `EpicsSortableComponent`/etc.
**Leçon** : lors d'une migration de directive, auditer explicitement CHAQUE appelant
existant pour toute syntaxe `&`-binding old-style restée intacte, pas seulement les
`bind-x` — une vérification en navigateur qui ne simule pas le clic précis sur CE bouton
particulier ne l'aurait pas détecté (mon scénario de test initial appelait directement les
callbacks avec `$event.id` correctement câblé dans le script, sans passer par les vrais
templates appelants).

### Phase 2, sous-projet 1 (suite) : `tgTaskboardSortable` → tout le tableau taskboard

Contrairement aux 4 modules "quick win" précédents, celui-ci a demandé de migrer
**l'intégralité** du tableau taskboard (en-tête, les 3 blocs de lignes, colonnes, cartes,
état de pli, calcul de largeur de colonne) en un seul nouveau composant
`TaskboardTableComponent`, sous le sélecteur conservé `tg-taskboard-sortable` — pas
seulement le wrapper de drag. Raison : l'original faisait glisser des tâches entre
**toutes** les cellules `.taskboard-column` du tableau (toutes lignes US × tous statuts,
une seule instance dragula), une tâche pouvant changer de statut ET être réassignée à une
autre US. `cdkDropListGroup` exige que toutes les `cdkDropList` connectées soient
descendantes du même arbre de composants Angular — dragula n'a pas cette contrainte.
Alternative écartée avec l'utilisateur : downgrader les directives CDK dans le template
AngularJS existant (jugée trop incertaine face à un vrai `.issues-wrapper` déjà exclu du
périmètre).

**Trouvaille surprenante à l'audit** : `usFolded`/`statusesFolded` (état de pli) et le
calcul de largeur de colonne n'étaient PAS définis par `TaskboardController` — une
directive complètement séparée, `tgTaskboardSquishColumn`, les posait sur le même `$scope`
ambiant partagé avec le contrôleur (aucun des deux n'aurait fonctionné seul). Les deux
sont maintenant possédés directement par le nouveau composant, persistés de la même
façon via `$tgResources.tasks.get/storeStatusColumnModes`/`get/storeUsRowModes`
(`AJS_TG_RESOURCES`, pas le plus petit `AJS_RESOURCES`, puisque ces méthodes vivent dans
`app/coffee/modules/resources/tasks.coffee`), largeur recalculée de façon réactive via des
bindings `[style]` plutôt que des appels jQuery `.css()` impératifs.

`ctrl.isMaximized`/`ctrl.isMinimized` (référencés dans le `ng-class` d'origine mais jamais
définis nulle part dans le code, ni dans le contrôleur ni ailleurs — probablement copiés
du kanban) sont omis, pas répliqués. `tg-taskboard-table-height-fixer` (aucune directive
enregistrée sous ce nom) supprimé sans remplacement. `tg-due-date` (mode icône seul,
utilisé ici) répliqué en ligne via `AJS_DUE_DATE_SERVICE` plutôt que de migrer toute la
directive `tg-due-date` (partagée ailleurs, risque de dérive de périmètre).
`addnewtask.jade` (2 boutons, pas de formulaire) et `taskboard-placeholder.jade` (2
branches statiques) inlinés directement, tous deux confirmés sans autre appelant.

Le `.issues-wrapper`/`tg-issues-table` vivait en fait DANS le fichier
`taskboard-table.jade` remplacé (pas directement dans `taskboard.jade` comme supposé au
début du scoping) — déplacé tel quel dans `taskboard.jade` pour rester inchangé plutôt que
d'être perdu par erreur lors de la suppression du fichier.

**Bizarrerie préexistante répliquée telle quelle** : la garde de permission d'origine
(`if not (my_permissions.indexOf("modify_task") > -1) and project.archived_code then return`)
active en fait le drag si la permission existe OU si le projet n'est PAS archivé — pas
"corrigée", juste reproduite à l'identique dans `sortingDisabled`.

Vérifié en navigateur headless (profil neuf) : rendu complet (2 lignes US + ligne
"storyless", en-têtes de colonnes, cartes), **un vrai drag simulé entre deux colonnes de
la même ligne US** (changement de statut seul) ET **un vrai drag entre deux lignes US
différentes** (réassignation ET changement de statut simultanés) — les deux cas que
`dragula` gérait dans une seule instance, chacun vérifié séparément puisque c'est la
vraie nouveauté par rapport aux 4 modules précédents (aucun n'avait de cross-conteneur
réel). Clic réel sur "ajouter une tâche" vérifié via CDP. Le clic de pli de colonne a été
vérifié fonctionnellement correct via un `.click()` DOM direct après qu'un premier essai de
clic par coordonnées CDP ait manqué la petite zone cliquable du bouton (20×20px) — un
artefact de script de test, pas un bug du composant. Karma (361 specs) reste vert.

**Les quatre candidats Phase 1 restants se sont tous révélés bloqués à la lecture du code**
— la feuille de route les avait listés comme "quick wins probables" sans avoir vérifié leur
implémentation en détail (comme elle le prévenait elle-même de ne pas faire) :

- `tgSprint` (`app/coffee/modules/backlog/sprints.coffee`) : sa propre déclaration a bien un
  scope isolé (`scope: {sprint: '=', project: '='}`), mais son template
  (`partials/backlog/sprint.jade`) utilise `tg-backlog-sprint-header` — une directive soeur
  du même fichier grab-bag, scope ambiant, qui fait son propre `$compile` manuel + insertion
  jQuery (`$el.html(compiledTemplate)`) et lit `$scope.project`/`$scope.sprint` directement.
  Mélanger un composant Angular avec un enfant AngularJS non-migré de ce genre demanderait soit
  de migrer `tg-backlog-sprint-header` (bloqué, même famille ambiante), soit un pont
  `UpgradeComponent` jamais utilisé ailleurs dans cette migration (jusqu'ici toujours
  AngularJS → Angular via `downgradeComponent`, jamais l'inverse) — hors périmètre d'un quick
  win.
- Famille `tgRelatedTask*` (`app/coffee/modules/related-tasks.coffee`) : **aucune** des cinq
  directives du fichier (`tgRelatedTaskRow`, `tgRelatedTaskCreateForm` avec `scope: true`,
  `tgRelatedTaskCreateButton`, `tgRelatedTasks`, `tgRelatedTaskAssignedToInlineEdition`) n'a de
  scope isolé — toutes lisent `$scope.project`/`$scope.us` ambiants et font leur propre
  `$compile` + manipulation jQuery. L'hypothèse de la feuille de route ("probablement analogue
  à `related-userstory-row`") était fausse : `related-userstory-row` vit dans un module
  totalement différent (`app/modules/epics/related-userstories/`), structuré proprement dès le
  départ — la ressemblance de nom a induit en erreur.
- `tgWikiNav` (`app/coffee/modules/wiki/nav.coffee`) : utilise `dragula` directement pour le
  réordonnancement des liens wiki — c'est le blocage Phase 2 (dragula), pas un quick win Phase 1.
- `tgWikiSummary` (`app/coffee/modules/wiki/main.coffee`) : même famille que `tgWikiNav` et
  `tgRelatedTask*` — scope ambiant (`$scope.usersById` lu directement), `$compile` manuel,
  `require: "ngModel"`.
- Famille `tgCsv*` (Epic/Issue/Task/Us, `admin/project-profile.coffee`) : les quatre
  directives utilisent `scope: true` (scope enfant, pas isolé) et leurs contrôleurs
  (`CsvExporter*Controller`) lisent `@scope.project`/`@scope.projectId` ambiants hérités du
  contrôleur parent de la page profil de projet — même blocage de fond.

Ces cinq candidats rejoignent donc la catégorie "scope ambiant" de la Phase 3 plutôt que la
Phase 1 — **la feuille de route doit être corrigée en conséquence** : après les deux
lightboxes de ce lot, il ne reste plus de candidat Phase 1 "quick win" identifié à ce jour. La
suite logique est soit un vrai sous-projet de Phase 2 (dragula recommandé), soit démarrer la
Phase 3 (refactor de scope ambiant) une fois un filet de tests en place, selon la priorité
produit de l'utilisateur.

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

- Les modules feature restants (`projects`, `epics`, `wiki`, `attachments`, `profile` en
  entier, etc.) - module par module, feuilles d'abord.
- `profile` (la route complète) : bloqué sur `tg-profile-tabs`/`tg-profile-tab`
  (transclusion imbriquée + `require: "^tgProfileTabs"` entre les deux directives - voir
  section `profile-hints` ci-dessus pour le détail). Nécessitera soit de garder les deux
  wrappées ENSEMBLE dans un seul `UpgradeComponent` (tout l'intérieur du tabset reste
  AngularJS, pas de composants Angular imbriqués à l'intérieur), soit de réécrire le
  système de tabs en Angular natif plutôt que de le wrapper.
- Bascule ngRoute → Angular Router (dernière étape).
- Suppression finale d'AngularJS, de `@angular/upgrade`, et du pipeline gulp coffee/jade.
- Résoudre le conflit de version karma pour activer `ng test` (voir ci-dessus).
- Modules sans aucun test aujourd'hui (`resources`, `utils`, `attachments`) : en écrire
  avant/pendant leur migration.

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
