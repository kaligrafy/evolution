# Exports et mapping des champs — discussion et TODO

Document de travail. Objectif : décider comment evolution devrait produire des exports dont les noms
de colonnes et les variables dérivées sont ceux qu'attendent les agences, au lieu de laisser chaque
équipe les reconstruire dans un outil statistique externe. Motivé par l'analyse des programmes SAS de
traitement du MTMD (`mtmd_sas_external-validation-audit-checks.md`) : une large part de leur code
n'est pas de la validation, c'est du renommage et du calcul de variables dérivées.

Comme le document d'audits, celui-ci ne donne aucun décompte de cas, et chaque champ nommé est à
confirmer contre les questionnaires courants : les enquêtes analysées avaient des questions que nous
ne posons plus, et nous en avons ajouté depuis.

## 1. État actuel du code

Trois exports coexistent, aucun ne connaît de mapping.

| Export | Point d'entrée | Sortie | Noms de colonnes |
| --- | --- | --- | --- |
| CSV par objet d'enquête | `GET /api/admin/data/prepareCsvFileForExportBySurveyObject`, puis worker `exportAllToCsvBySurveyObject` | Un CSV par collection découverte, `exports/interviewData/{corrected\|participant}_{chemin}_{projet}.csv` | Aplatissement dynamique du JSON `response` : chemins pointés, uuid remplacés par `_`, coordonnées éclatées en `.lon`/`.lat`, tableaux de primitives joints par `\|` |
| Journal paradata | Tâche CLI `exportInterviewLogs.task.ts` | Un CSV dans `exports/interviewLogs/` | Noms des colonnes de la base et des événements paradata |
| JSON par entrevue | Tâche CLI `exportInterviewsJson.task.ts` | Un fichier par entrevue | Aucun aplatissement, arbre `response` intact |

Fichiers : `packages/evolution-backend/src/services/adminExport/exportAllToCsvBySurveyObject.ts`,
`exportInterviewLogs.ts`, `packages/evolution-backend/src/tasks/exportInterviewsJson.task.ts`.

Points à connaître avant toute discussion :

- **La source de vérité est le JSON brut**, pas le modèle d'objets. L'export ne construit ni
  `Interview`, ni `Person`, ni `Household` : il parcourt `response` et sort ce qu'il y trouve. Les
  listes d'attributs canoniques (`personAttributes`, `householdAttributes`) et les classes de
  `baseObjects` ne jouent aucun rôle. Conséquence directe : rien de dérivé ne peut sortir, et un
  champ nommé n'importe comment par une enquête sort tel quel. Par contre, il devra le faire bientôt (TODO)
- **`_confidentialAttributes` est déclaré mais pas appliqué.** Les classes le définissent avec des
  commentaires « hidden when exporting », et aucun fichier de `evolution-backend/src` ne le lit. Les
  champs confidentiels sortent donc dans le CSV s'ils sont dans `response`.
- **Un précédent existe côté générateur.** `generate_questionnaire_dictionary.py` produit un
  dictionnaire à partir de l'Excel du questionnaire et abrège déjà les noms par section
  (`transform_path`, ligne 393 : abréviation de section + nom du champ). Il porte un `FIXME` et
  l'issue #1058 pour les chemins à plusieurs points. C'est le seul endroit du dépôt où un nom court
  et stable est associé à un chemin, et il ne parle pas à l'export.
- **`downloadCsvFile.ts` accepte une liste explicite de `requestedFields`** mais n'a aucun appelant.
  C'est le point d'accroche le plus proche d'un export piloté par une déclaration.
- **`requiredFieldsBySurveyObject`** dans `project.config` déclare déjà, par type d'objet, des noms
  de champs — pour les audits seulement. Même vocabulaire, autre usage.

## 2. Ce que les agences reconstruisent à la main

Tout ce qui suit est calculé après coup parce qu'evolution ne le sort pas. Les nomenclatures citées
sont celles de l'agence, elles ne valent pas comme standard, mais le besoin d'un motif ou d'un mode
regroupé, lui, revient à chaque enquête.

| Variable dérivée | Ce qu'il faut pour la produire |
| --- | --- |
| Motif de déplacement regroupé | Dérivé de l'activité de la destination. L'agence note explicitement que ce motif n'étant pas une variable d'evolution, elle ne peut pas l'utiliser pour reproduire une condition d'affichage du questionnaire, et renonce du coup à une validation |
| Mode regroupé, à deux niveaux de finesse | Regroupement de la question de mode et de sa sous-question |
| Groupe d'âge | Hors périmètre : `Person.ageGroup` est déprécié et l'âge est toujours requis dans nos enquêtes. Un regroupement en tranches reste un calcul d'analyse, pas une variable à exporter |
| Statut de répondant par personne | Une centaine de lignes de code externe, alors qu'evolution a déjà `whoWillAnswerForThisPerson` et `isProxy` sur `Person` : à vérifier, la variable est peut-être déjà exportable |
| Numéros séquentiels corrigés aux quatre niveaux | Renumérotation après suppression d'objets, parce que les séquences d'evolution portent les erreurs de saisie |
| Lignes de transport collectif éclatées en une colonne par ligne | Le modèle a déjà `Segment.busLines` comme tableau ; c'est l'export qui les rejoint en une chaîne à séparateurs, que l'agence doit ensuite redécouper |
| Indicateurs d'occupation jour par jour | Les champs multi-cases de jours en présentiel et à distance, transformés en un indicateur par jour et par activité, avec un codage qui distingue le refus du sans-objet |
| Un indicateur par organisme de transport, plus le nombre d'organismes | Éclatement d'un multi-cases de titres de transport, avec la mise en garde que le type de titre et l'organisme ne sont pas croisables une fois éclatés |
| Type de jonction | Dérivé de la paire de modes de part et d'autre du transfert, et non calculé pour les motifs de déplacement où les jonctions n'intéressent personne |
| Type de conducteur | Distinguer un uuid de membre du ménage d'une valeur catégorielle stockée dans le même champ. Déjà réglé dans le cœur : `Segment.driverType` et `driverUuid` sont deux attributs |
| Nombre de personnes à mobilité limitée dans le ménage | Agrégat de ménage, avec une valeur sentinelle quand le ménage en déclare mais qu'aucune personne n'est marquée |
| Nombre de déplacements par personne et par ménage | Agrégat, avec la distinction entre zéro déplacement et mobilité inconnue |
| Heure de départ sans les minutes, groupe d'heures, période | Sur une horloge d'enquête qui déborde minuit, donc pas une simple extraction d'heure |
| Rattachement des origines et destinations à des découpages géographiques | Jointure spatiale, faite à l'externe et réinjectée |
| Franchissement d'un cours d'eau | Devrait se dériver de la position des deux extrémités du déplacement, pas rester la valeur déclarée : l'agence corrige la déclaration après vérification géographique |
| Longitude et latitude en colonnes numériques distinctes | L'agence redécoupe une chaîne « lon, séparateur, lat » pour chaque géographie du fichier, cinq fois dans le même programme, et a dû reprendre deux fois l'arrondi des décimales après livraison. À instruire : notre exporteur éclate déjà les géographies en `.lon` et `.lat`, donc soit le fichier reçu ne vient pas de ce chemin, soit un autre étage recompose la chaîne |
| Clés hiérarchiques lisibles | Les partenaires reçoivent des clés numériques composées du code d'accès et des numéros de personne et de déplacement, pas les uuid. L'export devrait porter les deux : l'uuid pour joindre sans ambiguïté, la clé hiérarchique pour travailler |
| Code de référentiel pour un lieu nommé | L'agence remplace le libellé du lieu choisi par un code renvoyant à une table de noms, adresses et coordonnées. L'export devrait porter la clé du référentiel, pas l'étiquette affichée : deux entrées portant le même libellé ont dû être renommées à la main pour être distinguables |
| Drapeau de rupture de chaîne | Marque le déplacement dont l'origine n'est plus la destination du précédent, après retrait d'un déplacement du carnet. Se dérive de la comparaison des extrémités, avec une tolérance de quelques mètres pour absorber les arrondis de coordonnées |
| Drapeau de correction, par variable corrigée | Colonne accompagnant une variable corrigée, dont la valeur dit *quelle* règle a été appliquée. Voir `mtmd_sas_auto-corrections.md` §4 : c'est la forme que prendrait le marquage des valeurs corrigées |
| Facteurs d'expansion | Hors périmètre, travail statistique de l'agence, mais ils reviennent dans le fichier final |
| Recodage des « autre, précisez » | Tableur, réinjecté par appariement sur l'uuid ; le poste le plus volumineux du traitement |

Deux problèmes structurels apparaissent dans cette liste, et le modèle d'objets d'evolution les a
déjà résolus tous les deux — c'est l'export qui les réintroduit. Le premier est le champ qui mélange
deux domaines de valeurs, un uuid signifiant « membre du ménage » et une chaîne signifiant une
catégorie de conducteur, que l'agence doit désambiguïser d'après la longueur de la valeur. Le second
est le multi-valeur sérialisé dans une chaîne, qui oblige tout consommateur à écrire un parseur, avec
le risque qu'une valeur contenant le séparateur passe à travers.

Un troisième point ressort de l'étape finale du traitement. Plusieurs variables sont produites hors
du traitement principal — imputations, découpages géographiques, facteurs d'expansion — puis
réinjectées dans le fichier par **position de ligne**, avec une vérification a posteriori que les
identifiants concordent. Ça marche tant que personne ne retrie ni ne filtre entre les deux. L'export
doit donc toujours porter les identifiants stables des objets, à tous les niveaux, pour qu'un
enrichissement externe puisse se joindre dessus plutôt que sur un numéro de ligne. C'est aussi ce qui
permettrait de réimporter dans evolution une correction faite à l'extérieur.

Les rondes de correction post-livraison rendent l'exigence plus stricte encore. Chaque ronde supprime
ou ajoute des objets, donc renumérote les personnes et les déplacements et recompose les clés
hiérarchiques : une correction repérée sur la version précédente ne retrouve plus sa cible. L'agence
s'en sort en conservant dans le fichier de travail les identifiants de chaque version antérieure, une
colonne par version et par niveau, ce qui est exactement la rustine que des identifiants stables
rendraient inutile. Règle à en tirer : **une cible de correction se désigne par un identifiant
d'objet, jamais par un numéro de séquence ni par une position**, puisque toute autre correction du
même lot peut renuméroter la séquence.

## 3. Décisions à prendre

Aucune n'est tranchée. Elles sont classées de la plus structurante à la plus locale.

1. **Est-ce que l'export doit passer par le modèle d'objets ?** Aujourd'hui non, et c'est ce qui
   rend impossible toute variable dérivée : un getter sur `Person` ou `Trip` sortirait
   naturellement. Le coût est réel, l'export deviendrait dépendant de l'unserializer et de sa
   tolérance aux données partielles ou incohérentes, ce qui est exactement ce qu'un export de
   révision doit supporter. Piste intermédiaire : garder l'export brut tel quel, et ajouter un
   second export « enrichi » construit sur les objets, ce que `baseObjects/README.md` évoque déjà en
   distinguant trois types de données exportées.
2. **Où vit la déclaration du mapping ?** Trois candidats : l'Excel du questionnaire, avec le
   générateur qui produit à la fois le dictionnaire et l'en-tête d'export ; un fichier de
   configuration TypeScript par enquête ; des métadonnées sur les attributs des objets de base. Le
   premier a l'avantage d'un précédent en place et d'un propriétaire clair, la personne qui écrit le
   questionnaire. Le troisième est le seul qui puisse couvrir les variables dérivées, qui n'ont pas
   de ligne dans l'Excel.
3. **Cœur ou enquête ?** Les noms courts d'une enquête donnée ne sont pas universels, mais la
   mécanique de mapping l'est. À trancher : le cœur fournit le mécanisme et chaque enquête fournit
   sa table, ou le cœur fournit aussi un jeu de noms standard pour les objets qu'il définit.
4. **Faut-il des codes numériques ?** Question tranchée par les faits : le programme de recodage de
   l'agence ne fait que ça, traduire les chaînes d'evolution en codes numériques sous les noms de
   colonnes officiels, pour une cinquantaine de variables de ménage et de personne et une trentaine
   de variables de déplacement et de segment. Le mapping de valeurs n'est donc pas optionnel, et il
   a trois propriétés qu'un mécanisme naïf ne couvrirait pas :
   - **Plusieurs nomenclatures cibles pour un même champ.** Le motif de déplacement et le mode
     sortent à la fois dans la codification courante et dans une codification héritée, pour garder
     la comparabilité avec les enquêtes précédentes, plus un regroupement plus grossier dérivé de
     la seconde. Un mapping doit donc pouvoir déclarer N nomenclatures par champ, dont certaines
     définies comme des regroupements d'une autre.
   - **Des codes sentinelles pour la non-réponse et la non-applicabilité**, omniprésents et
     hétérogènes d'un champ à l'autre : une valeur pour le refus, une pour « ne sait pas », une
     pour l'enfant trop jeune pour la question, une pour le compte inconnu, une pour « la question
     ne s'appliquait pas », et une pour « la question n'existait pas encore à ce moment de la
     collecte ». Ce dernier code est le plus parlant : la fenêtre de validité discutée au point 7
     et l'applicabilité de #1916 finissent, faute d'être produites par evolution, écrites à la
     main comme valeurs dans le fichier livré.
   - **Un code sentinelle ne doit jamais être une valeur valide du domaine.** Dans les fichiers
     géographiques réinjectés, l'absence de coordonnée arrive codée par un zéro, que l'agence doit
     reconvertir en valeur manquante ; or zéro est une coordonnée parfaitement valide. Même
     principe pour les comptes et les âges : la valeur d'absence doit être hors domaine, ou mieux,
     rester vide.
   - **Une table de mapping doit être validée contre la liste de choix.** Une entrée du programme
     comportait une faute de frappe dans la valeur source, et le recodage tombait silencieusement
     dans le cas par défaut : la variable sortait vide sans que rien ne le signale. Une table de
     correspondance non vérifiée contre le domaine réel est un piège à erreurs muettes, donc le
     mécanisme doit refuser au démarrage un mapping dont une clé source n'existe pas, et signaler
     toute valeur du domaine sans cible.
5. **Un fichier plat ou plusieurs ?** L'export actuel produit un fichier par niveau ; les agences
   fusionnent tout en un fichier unique où chaque ligne est un segment, avec des indicateurs
   marquant la première ligne de chaque ménage, personne et déplacement. La fusion est triviale pour
   elles et coûteuse pour nous, donc probablement à laisser de leur côté, mais autant le dire
   explicitement.
6. **Faut-il appliquer `_confidentialAttributes` ?** Déclaré, jamais appliqué. Si on l'applique, il
   faut un mode « export admin » qui les inclut, sinon la révision perd des champs dont elle a
   besoin.
7. **Identifier la livraison dans le fichier lui-même.** Le fichier livré porte deux colonnes que
   nous n'avons pas : un libellé de version et une date de production. Ça paraît anodin, et c'est
   ce qui permet, six mois plus tard, de savoir laquelle des copies qui circulent est celle dont
   quelqu'un parle. Une livraison existe d'ailleurs en deux tiers : un fichier de travail qui garde
   tout, y compris les variables intermédiaires, et un fichier officiel qui n'en est qu'un
   sous-ensemble de colonnes. Notre export gagnerait le même couple, et c'est le même mécanisme que
   la sélection de colonnes évoquée au point 6.
8. **Versionner le codebook.** Une enquête change en cours de route : dans les enquêtes analysées,
   des questions ont été ajoutées après le début de la collecte, et les réponses manquent
   légitimement pour tout ce qui précède l'ajout. Un dictionnaire sans date de validité ne décrit pas
   les données. Même besoin que la fenêtre de validité discutée pour les audits d'applicabilité
   (#1916).
9. **Déclarer les limites de format, et rendre visible ce qu'elles coupent.** Un fichier plat impose
   deux limites qu'un arbre d'objets n'a pas, et les deux ont mordu.
   - **La cardinalité d'un champ tableau.** Les lignes de transport collectif d'un segment
     deviennent une colonne par ligne, donc leur nombre doit être borné. Quelques déplacements
     dépassaient la borne, et la décision retenue est instructive : plutôt que de couper au
     silence, l'agence a remplacé la première ligne par « ne sait pas » et vidé les autres,
     c'est-à-dire dégradé la donnée explicitement. C'est la bonne réponse, et elle demande que le
     nombre de colonnes soit un paramètre déclaré plutôt qu'une conséquence du contenu du lot :
     sinon, la largeur du fichier change d'une livraison à l'autre.
   - **La longueur maximale des champs texte.** Quelques champs libres arrivaient à plusieurs
     centaines de caractères, forçant une troncature, et un texte de plusieurs centaines de
     caractères dans un champ « nom du lieu » est de toute façon le signe que le champ a servi à
     autre chose. Chaque champ texte exporté devrait porter une longueur maximale déclarée, et un
     dépassement mérite un audit check informatif plutôt qu'une coupure discrète.

## 4. Direction proposée

Deux principes, à valider avant d'écrire une ligne de code.

**Une seule source pour le codebook et l'en-tête d'export.** Le dictionnaire du générateur et
l'en-tête du CSV décrivent la même chose, il ne doit pas y avoir deux tables à maintenir en
parallèle. Le générateur sait déjà associer un chemin à une abréviation de section : c'est cette
association qu'il faut rendre lisible par le backend, plutôt que d'inventer un second mécanisme.
Régler #1058 devient un prérequis, car des chemins à plusieurs points sont exactement ce qu'on
exporte.

**Les variables dérivées appartiennent au modèle, pas à l'export.** Un motif de déplacement regroupé,
un mode regroupé, un statut de répondant : chacun est un getter sur l'objet concerné, utile aussi aux
audit checks, à l'UI de révision et aux tableaux de suivi. Les calculer dans l'exporteur les rendrait
invisibles partout ailleurs, et l'analyse des programmes externes montre le coût de cette
invisibilité : faute d'un motif de déplacement dérivé, une condition d'affichage du questionnaire
n'est pas reproductible, donc la validation correspondante est abandonnée.

Un corollaire, illustré par le recodage : une dérivation **stockée** devient fausse dès que la
classification qui l'alimente change. En reclassant un mode d'une famille à une autre, l'agence a
invalidé le type et le nombre de jonctions de tous les déplacements concernés, et a dû les
recalculer à la main, à un endroit du programme éloigné de celui où la dérivation d'origine est
définie. Une dérivation calculée à la lecture, sur l'objet, ne peut pas se désynchroniser de sa
source ; c'est l'argument le plus concret en faveur de getters plutôt que de colonnes figées.

## 5. TODO

- [ ] Faire valider les décisions du §3 par l'équipe, en priorité les points 1 à 3.
- [ ] Concevoir le mapping de valeurs avec les trois propriétés du point 4 : nomenclatures
      multiples par champ, codes sentinelles dérivés de l'applicabilité plutôt qu'écrits à la main,
      et validation de la table contre les listes de choix.
- [ ] Recenser les variables dérivées à porter sur les objets, avec l'objet propriétaire de chacune,
      à partir du tableau du §2.
- [ ] Créer un issue par famille de variables dérivées, en commençant par le motif de déplacement et
      le mode regroupé, qui bloquent aussi des audit checks.
- [ ] Décider du sort des champs qui ne servent qu'au déroulement du questionnaire et qui sortent
      aujourd'hui sans documentation : exclus de l'export, ou documentés. L'agence en analyse
      plusieurs longuement avant de les écarter, faute de savoir à quoi ils servent.
- [ ] Régler #1058 avant de brancher le dictionnaire sur l'export.
- [ ] Écrire un README d'export : il n'en existe aucun, et rien ne documente la règle
      uuid → `_` ni le nommage des fichiers.

## 6. Défauts constatés, à ficher

- **Nom de tâche worker désaccordé.** `EvolutionWorkerPool.ts:18` enregistre `exportInterviewLog`,
  et `exportInterviewLogs.ts:365` appelle `execJob('exportInterviewLogs', ...)`. La fonction
  `exportInterviewLogs` n'a aucun appelant, donc le défaut est latent : il tombera le jour où
  quelqu'un branche l'export de paradata sur une route admin. La tâche CLI, elle, appelle
  `exportInterviewLogTask` directement et fonctionne.
- **`_confidentialAttributes` sans effet**, voir §1. Soit on l'applique, soit on retire les
  commentaires qui promettent qu'il protège quelque chose.
- **Valeur tronquée dans le CSV.** L'agence corrige à la main un champ de ménage dont le refus
  arrive tronqué à sept caractères, donc méconnaissable. À localiser : `formatValue`
  (`exportAllToCsvBySurveyObject.ts:327`) ne tronque rien, donc la coupure vient soit de l'étage
  d'import de l'agence, soit d'un export antérieur. À instruire avant de conclure, mais une valeur de
  liste de choix tronquée est indétectable en aval : elle ressemble à une valeur légitime inconnue.
- **Aucun test de nommage de colonnes.** Les tests couvrent l'aplatissement, les uuid et les
  tableaux, mais aucun mapping ni filtrage, ce qui est cohérent puisque rien de tel n'existe.
- **Colonnes héritées dans l'export.** Sur `main`, le fichier `interview` porte encore `is_valid` et
  `is_validated` (`exportAllToCsvBySurveyObject.ts:262` et `264`) ; la PR #1891 les remplace par
  `review_status`.
- **Pas d'export de paradata dans l'UI admin.** Seule une tâche CLI, alors que l'export CSV a une
  page.
