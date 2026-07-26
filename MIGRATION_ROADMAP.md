# Feuille de route : migrer ce qu'il reste

## Contexte

Depuis le lancement de la migration hybride AngularJS → Angular (pattern "leaf en place" :
un directive AngularJS devient un `@Component` Angular downgradé sous le même nom, migré
un par un, sans toucher au routing ni au reste de l'app), une soixantaine de modules ont
été migrés en plusieurs lots, chacun avec build + karma verts et, pour les plus récents,
une vérification en navigateur réel. `MIGRATION.md` documente chaque décision, chaque bug
trouvé, et chaque module explicitement écarté avec sa raison technique précise — c'est la
source de vérité à consulter avant de retoucher quoi que ce soit ci-dessous.

Le gisement de candidats "faciles" (scope isolé, sans lib tierce, sans `tg-nav`) s'est
nettement réduit après le 5ème lot. L'ajout d'un `tg-nav` Angular natif
(`src/app/shared/tg-nav.directive.ts`) a rouvert des modules de plus. Ce qui reste se
répartit maintenant en catégories bien identifiées, chacune bloquée pour une raison
différente — d'où ce document : plutôt qu'une liste plate de "modules restants", une
feuille de route par type de blocage, pour savoir où investir l'effort ensuite et dans
quel ordre.

## Ce qui marche (à continuer, sans changement de méthode)

Le motif qui a fonctionné à tous les coups : directive dans **son propre fichier dédié**
(pas un fichier "grab-bag" multi-directives), **scope isolé** (`scope: {}` +
`bindToController`, jamais `scope: true` ni scope par défaut), sans dépendance à une lib
tierce. Patron complet dans `MIGRATION.md` (section "Patron à suivre").

## Ce qui est prouvé bloqué (ne pas retenter sans lever le vrai blocage)

| Blocage | Symptôme repéré | Exemples déjà écartés |
|---|---|---|
| Scope ambiant (hérité du contrôleur parent, pas isolé) | `scope: true` ou pas de `scope:` du tout, lit `$scope.project`/`$scope.usersById` directement | `ticket-watchers`, toute la famille `assigned-*`, `lb-select-user`, `tgSprint` (via sa dépendance `tg-backlog-sprint-header`), toute la famille `tgRelatedTask*`, `tgWikiSummary`, la famille `tgCsv*` |
| Fichiers "grab-bag" multi-directives anciens | Même style que ci-dessus, en pire (souvent 10+ directives par fichier) | `common/components.coffee`, `admin/memberships.coffee` (le reste), `auth.coffee`, `team/main.coffee`, `related-tasks.coffee`, `backlog/sprints.coffee` |
| Drag & drop (`dragula`) | `*-sortable` (kanban, backlog, taskboard, epics, related-userstories) | `filter` (sélecteur jQuery global en plus), `tgWikiNav` |
| Éditeur WYSIWYG (CKEditor) | `tg-comment-edit-wysiwyg`, `tg-item-wysiwyg`, `tg-wysiwyg` | `comment`, `comments` |
| Validation de formulaire (checksley) | `.checksley()` dans le `link` | `create-epic`, `lb-feedback` |
| Listes infinies (`ngInfiniteScroll`) | `infinite-scroll="..."` sur le conteneur | `profile-favs`, `wiki-history` (le parent, pas ses enfants déjà migrés) |
| HTML compilé dynamiquement avec directives vivantes | `tg-compile-html` sur du contenu généré contenant un `tg-nav` intégré | `user-timeline-item` (voir section dédiée dans `MIGRATION.md`) |
| Transclusion + `require` imbriqués entre 2 directives | `transclude: true` + `require: "^parentDirective"` | `profile-tabs` (bloque toute la route `/profile`) |
| Composant énorme via `include` Jade en cascade | Un seul directive avec 15-20 sous-templates | `history`/`history-diff` (20 sous-templates, ~2 modules pour l'effort de 20) |

## Phase 1 — Prochains gains rapides (même méthode) — ✅ terminée, résultat mitigé

**Statut : traitée.** Sur les six groupes de candidats initialement listés ici
(`tgLbContactProject`, `tgLbImportError`, `tgSprint`, la famille `tgRelatedTask*`,
`tgWikiNav`/`tgWikiSummary`, la famille `tgCsv*`), seuls les **deux lightboxes** se sont
avérés être de vrais quick wins une fois le code lu en détail :

- `tgLbContactProject` → `LightboxContactProjectComponent` ✅ migré.
- `tgLbImportError` → `LightboxImportErrorComponent` ✅ migré.
- `tgSprint`, la famille `tgRelatedTask*`, `tgWikiNav`, `tgWikiSummary`, la famille
  `tgCsv*` : ❌ tous bloqués (scope ambiant ou dragula) — reclassés dans le tableau
  "prouvé bloqué" ci-dessus. Détail complet de pourquoi chacun est bloqué : voir
  `MIGRATION.md`, section "Phase 1 (feuille de route post-63-modules)".

Au passage, deux bugs de production réels (non liés à un nouveau module, mais découverts
en vérifiant les lightboxes en navigateur) ont été trouvés et corrigés : `lightboxFactory.create`
construisait chaque lightbox comme un attribut sur un `<div>` plutôt qu'un élément propre
(cassait silencieusement 3 lightboxes déjà migrées), et quatre composants lightbox
n'appelaient jamais `lightboxService.open()` (restaient invisibles). Détails et correctifs
dans `MIGRATION.md`.

**Conclusion** : il ne reste plus de candidat "quick win" isolé identifié à ce jour. La
suite passe forcément par la Phase 2 ou la Phase 3 ci-dessous.

## Phase 2 — Remplacer une dépendance tierce à la fois (débloque un gros bloc chacune)

Chaque ligne ci-dessous est un projet à part entière (décision d'archi + implémentation +
tests), pas un "module de plus". À choisir un par un selon la priorité produit :

1. **Drag & drop (`dragula` → `@angular/cdk/drag-drop`)** — débloque tout le tableau
   kanban, le backlog, le taskboard (`*-sortable`, `tg-kanban-*`, `tg-backlog-*`,
   `tg-taskboard-*`), et aussi `tgWikiNav`. C'est le bloc le plus gros et le plus visible
   du reste de l'app.

   **🚧 En cours.** Infrastructure en place (`@angular/cdk@17.3.10`, `DragDropModule`
   importé). Trois modules migrés, motif "liste entière internalisée dans le composant,
   pas de downgrade des directives CDK dans un template AngularJS" validé trois fois, avec
   un vrai geste de drag simulé en navigateur à chaque fois (pas seulement le rendu
   statique) :
   - `tgSortProjects` → `SortProjectsComponent` ✅ (bug de retour optimiste manquant
     trouvé et corrigé au passage — détails dans `MIGRATION.md`).
   - `tgAttachmentsSortable` → `AttachmentsSortableComponent` ✅ (a aussi internalisé le
     lien "afficher/masquer les pièces jointes obsolètes" adjacent, dans le même bloc DOM
     que la liste d'origine).
   - `tgRelatedUserstoriesSortable` → `RelatedUserstoriesSortableComponent` ✅ (deux
     vérifications de permission distinctes dans l'original, gardées distinctes plutôt que
     fusionnées — détails dans `MIGRATION.md`).

   Prochain candidat : `tgEpicsSortable` (scope ambiant, à vérifier comme les précédents) ;
   puis les 3 usages de `admin/project-values.coffee` (scope ambiant à lever d'abord) ; les
   trois gros (`backlog`/`kanban`/`taskboard`) restent un chantier séparé, à cause du drag
   multi-conteneurs dynamique et de `window.dragMultiple` (aucun équivalent CDK prêt à
   l'emploi).
2. **Éditeur WYSIWYG (CKEditor → wrapper `UpgradeComponent` ou remplacement moderne)** —
   débloque `comment`/`comments` et les champs description partout (`tg-item-wysiwyg`).
3. **Validation de formulaire (checksley → Angular Reactive Forms)** — débloque
   `create-epic`, `create-project-form`, `lb-feedback`, et probablement d'autres
   formulaires de lightbox pas encore audités.
4. **Listes infinies (`ngInfiniteScroll` → directive Angular à base d'IntersectionObserver)**
   — débloque `profile-favs`, `wiki-history` (dont les enfants sont déjà migrés et
   attendent juste ça).

Recommandation : commencer par le drag & drop (impact le plus large), sauf priorité produit
différente.

## Phase 3 — Refactor du scope ambiant (le plus gros bloc, le plus risqué)

La majorité des directives "boutons de statut" sur les pages de détail (`tg-epic-status-*`,
`tg-issue-status-*`, `tg-task-status-*`, `tg-us-status-*`), les widgets CRUD admin
(`tg-memberships-row-*`, `tg-project-*-values`, `tg-roles`, `tg-edit-role`, la famille
`tgCsv*`...), la page équipe (`tg-team-*`), les réglages de notifications utilisateur
(`tg-user-*-notifications*`), les pages d'auth (`tg-login`, `tg-register`...), et
maintenant aussi `tgSprint`, la famille `tgRelatedTask*` et `tgWikiSummary` partagent le
même blocage : elles lisent le scope du contrôleur parent directement au lieu de bindings
isolés explicites.

Deux options, à trancher au cas par cas :
- Réécrire le contrôleur parent pour exposer des bindings isolés propres (le "bon" fix,
  mais touche du code métier pas encore testé dans cette migration — prévoir des tests
  avant/pendant, comme noté dans `MIGRATION.md`).
- Garder le sous-arbre concerné 100% AngularJS et le wrapper en bloc via
  `UpgradeComponent` au niveau du parent plutôt que du leaf (évite le refactor, mais ne
  migre rien de l'intérieur).

Ne pas se lancer dans cette phase sans un vrai filet de tests, vu le nombre de modules
concernés et le risque de régression sur du code non touché depuis longtemps.

## Phase 4 — `tg-compile-html` et contenu HTML généré dynamiquement

`user-timeline-item` (voir `MIGRATION.md`) et le même schéma dans
`notifications.service.coffee` (titres d'activité générés côté client, avec `tg-nav`
intégré). Nécessite soit un pont `$compile` manuel depuis un composant Angular, soit
réécrire `user-timeline-item-title.service.coffee` pour qu'il retourne des données
structurées (nom de route + params) plutôt qu'une chaîne HTML avec directive intégrée.

## Phase 5 — Bascule ngRoute → Angular Router (dernière étape avant suppression)

Une fois l'essentiel des phases 1-4 fait, remplacer `$routeProvider`/`ngRoute` par Angular
Router pour de vrai. C'est ce qui permettrait de retirer `tg-nav` (l'ancien comme le
nouveau) et AngularJS entièrement. Gros chantier à part (déjà écarté explicitement du
périmètre initial) — ne pas le démarrer avant que la majorité des pages ne soit déjà
Angular, sous peine de faire cohabiter deux systèmes de routing pour rien.

## Phase 6 — Suppression finale

Une fois Phase 5 terminée : retirer `@angular/upgrade`, AngularJS, le pipeline gulp
coffee/jade, et tout ce qui reste de l'ancien bootstrap.

## Recommandation concrète pour la suite immédiate

1. ~~Phase 1~~ — terminée (2 modules migrés, 5 reclassés bloqués, 2 bugs de production
   corrigés au passage).
2. Choisir **un seul** sous-projet de la Phase 2 (drag & drop recommandé en premier vu
   son impact) plutôt que de viser un "gros lot de modules" — ces migrations-là sont des
   projets, pas des leaves.
3. Revenir à la Phase 3 seulement une fois qu'un vrai filet de tests existe pour les
   contrôleurs parents concernés.

## Vérification (comme les lots précédents)

Pour chaque module : `npm run build:ng`, `karma` (compter les specs supprimées), puis
vérification en Chrome headless avec connexion simulée (`localStorage.setItem('userInfo', ...)`)
sur un **profil Chrome neuf** à chaque fois (un profil réutilisé a déjà caché un faux
négatif). Pour les projets de Phase 2/3, prévoir en plus un test manuel contre le vrai
`taiga-back` de l'utilisateur (confirmé actif sur `localhost:8000`) puisque
l'environnement d'exécution ne peut pas simuler drag & drop, upload de fichiers, ou données
serveur réalistes.
