# Corrections automatiques — inventaire et discussion

Document de travail. Un audit check signale ; il ne corrige pas. Or une bonne moitié du travail que
les agences font après coup consiste à appliquer des corrections déterministes, dont la règle est
connue d'avance et ne demande aucun jugement. Ce document recense ces corrections, dit lesquelles
evolution devrait offrir, et à quelles conditions.

Source : les programmes SAS de correction et de fusion du MTMD, pour deux enquêtes régionales
récentes. Les checks tirés des mêmes programmes sont dans
`mtmd_sas_external-validation-audit-checks.md`, qui explique aussi pourquoi ce document ne donne aucun
décompte de cas et pourquoi chaque champ nommé est à confirmer contre les questionnaires courants.

## 1. Ce qu'evolution a déjà, et ce qui manque

Ce qui existe :

- **`corrected_response`**, colonne distincte de `response`, avec l'export qui choisit entre les
  deux (`responseType` : `participant`, `corrected`, `correctedIfAvailable`). La séparation entre
  ce que le répondant a dit et ce que la révision a retenu est donc déjà en place, et c'est
  l'essentiel.
- **Des corrections structurelles avec réconciliation**, côté questionnaire :
  `deleteVisitedPlace` (`odSurvey/helpers.ts:1702`) supprime un lieu, remplace les raccourcis qui le
  visaient, fusionne deux domiciles devenus consécutifs et renumérote via
  `reconcileVisitedPlaces` (ligne 1463). C'est exactement le patron dont la révision a besoin, mais
  il sert aujourd'hui au répondant qui modifie son carnet.
- **Des checks de trous de séquence** (`HH_W_PersonSequenceGaps`, `J_W_TripSequenceGaps`,
  `P_W_JourneySequenceGaps`, `J_W_VisitedPlaceSequenceGaps`), qui signalent le symptôme d'une
  suppression sans renumérotation.

Ce qui manque :

- **Aucune notion de correction proposée dans les audits.** Le type `Audit`
  (`evolution-common/src/services/audits/types.ts`) porte `errorCode`, `level`, `message`, `ignore`
  et rien d'autre. Un check qui sait exactement quoi corriger ne peut pas le dire.
- **Aucune correction offerte au réviseur** au-delà de l'édition manuelle champ par champ.
- **Aucune trace des corrections faites hors d'evolution.** Les recodages d'occupation vivent dans
  un tableur, les corrections d'heures dans un autre. Inversement, les corrections faites dans
  evolution par les réviseurs sont invisibles au traitement externe, qui les redécouvre à chaque
  version. Perte d'information dans les deux sens.
- **Aucun moyen de corriger à la source et de relivrer.** Faute de ça, les corrections
  post-livraison s'appliquent au fichier plat déjà produit, version après version, chacune
  reprenant les identifiants de la précédente pour retrouver ses cibles et recalculant derrière elle
  les clés, les numéros de séquence et les variables dérivées. Trois versions successives pour une
  enquête, chacune un programme complet. L'écart entre ce que contient evolution et ce que contient
  la donnée livrée ne se referme jamais : il grandit à chaque ronde. C'est la justification la plus
  forte pour que les corrections vivent dans `corrected_response` et que l'export soit rejouable.

## 2. Inventaire des corrections relevées

Classées par famille, avec l'endroit où la correction devrait vivre.

### A. Normalisation de valeurs

Aucun jugement requis, aucune information créée. Le meilleur candidat pour une correction
automatique.

| Correction | Où ça devrait vivre |
| --- | --- |
| Valeur absente de la liste de choix courante, parce que la liste a changé en cours d'enquête et que les valeurs déjà saisies n'ont pas été migrées | Migration de données au changement de liste, plus un audit check filet de sécurité (`X_I_ValueNotInCurrentChoiceList`) |
| Ordre des cases cochées : deux réponses multi-cases identiques au tri près sont traitées comme équivalentes | Collecte : une réponse multi-cases devrait être stockée dans un ordre canonique, ou lue sans égard à l'ordre |
| Valeur tronquée à l'export, au point qu'un refus ne se distingue plus | Défaut d'export, voir `mtmd_sas_exports-field-mapping-todo.md` |

### B. Complétion par inférence

Ici on invente une valeur que personne n'a donnée. C'est la famille la plus délicate.

| Correction | Commentaire |
| --- | --- |
| Ménage déclarant aucun membre à mobilité limitée ⇒ chaque personne du ménage passe à « non », sauf les enfants trop jeunes pour la question | Défendable, c'est la logique du questionnaire, mais la correction crée un très grand nombre de valeurs sans marqueur. Si evolution le fait, ça doit être une valeur dérivée lisible comme telle, pas une écriture dans la réponse |
| Ménage d'une personne ⇒ l'indicateur du ménage reprend la réponse individuelle | Inférence sûre, dans les deux sens |
| Enfants d'âge scolaire obligatoire ⇒ occupation « étudiant à temps plein » et études en présentiel | Hypothèse forte : l'école est obligatoire, mais l'enseignement à domicile existe. À valider avec l'agence avant d'en faire une règle |
| Segment de transport collectif sans ligne déclarée ⇒ `dontKnow` | Sûr : distinguer « pas répondu » de « ne sait pas » quand la question a bien été posée |
| Déplacement sans aucun segment ⇒ créer un segment de mode `dontKnow` | Rend le fichier régulier ; à faire à l'export plutôt que dans la donnée |
| Passager sans conducteur déclaré ⇒ `dontKnow` | Même raisonnement |
| Nombre d'occupants renseigné par quelqu'un qui n'était pas le répondant ⇒ vidé | Suppression d'une valeur jugée non fiable, pas une inférence. Discutable : la valeur existe, elle vient peut-être d'un changement de répondant en cours d'entrevue |

### C. Suppressions structurelles

Chacune impose de renuméroter, et chacune peut détruire une information portée par l'objet supprimé.

| Correction | Effets de bord traités par l'agence |
| --- | --- |
| Supprimer les déplacements dont le motif est une activité en boucle sans destination fixe | Les personnes qui n'avaient que ce type de déplacement perdent tout leur carnet : leur enregistrement est conservé et la personne repasse à non mobile. Puis renumérotation complète |
| Supprimer les segments de marche quand la marche n'est pas le seul mode du déplacement | La réponse à la question de franchissement était portée par une bonne part des segments supprimés : elle est reportée sur le segment conservé. Renumérotation. Et la note laissée en suspens : le retrait peut créer de nouvelles jonctions intermodales pour lesquelles aucune information n'a été collectée |
| Supprimer un segment quand deux modes consécutifs sont identiques | Règle dégagée : si la seule différence entre les deux est un champ rempli sur un seul, on garde celui qui porte la valeur. Le reste part en révision manuelle |
| Supprimer les déplacements dont les deux extrémités sont hors du territoire d'enquête | Une partie des personnes concernées perdent tout leur carnet et repassent non mobiles ; les autres gardent un carnet troué, et le fichier livré porte alors un drapeau de rupture sur le déplacement dont l'origine n'est plus la destination du précédent |
| Supprimer des personnes, ou une entrevue entière jugée invalide | Impose de renuméroter les personnes du ménage et de recalculer sa taille. Une suppression peut aussi déplacer l'indicateur de première ligne du ménage, donc casser les agrégats si on l'oublie |
| Fusionner en un seul les déplacements successifs d'une tournée de travail sur la route | Le déplacement résultant emprunte l'origine du premier et la destination du dernier, et sa durée est recalculée |
| Ajouter des déplacements jamais saisis, quand la personne a déclaré s'être rendue quelque part | Les heures viennent de déplacements « donneurs » comparables. C'est de l'imputation structurelle, la plus lourde de toutes |
| Ré-attribuer à la bonne personne les déplacements saisis sous une autre | Arrive quand deux membres du ménage ont été intervertis à la saisie |

Les personnes repassées à « non mobile » illustrent le vrai risque : supprimer un objet change un
attribut du parent. Une suppression en révision n'est jamais locale.

Deux enseignements s'ajoutent à ça, tirés des rondes de correction faites après la première
livraison.

D'abord, **le coût d'une correction en cascade est le meilleur argument en faveur de l'arbre
d'objets.** Faire passer une personne de travailleur à sans emploi demande, dans un fichier plat,
de remettre à leur valeur de non-applicabilité une vingtaine de champs dépendants : type de travail,
coordonnées du lieu habituel, nom du lieu, raison de non-déplacement, et les quatorze indicateurs
jour par jour de présentiel et de télétravail. Faire passer une personne à non mobile en demande
près de quatre-vingts. Chaque champ oublié est une incohérence livrée. Dans evolution, la même
correction est la suppression d'objets et l'écriture d'un attribut : la cascade est portée par la
structure. Corollaire pour la révision : l'interface doit offrir des opérations sur les objets, pas
seulement l'édition champ par champ, sinon on refait la liste de vingt champs à la main.

Ensuite, **une suppression structurelle doit laisser une trace dans la donnée livrée.** Quand on
retire un déplacement au milieu d'un carnet, la chaîne n'est plus continue : l'origine d'un
déplacement n'est plus la destination du précédent. L'agence a ajouté pour ça un drapeau de rupture
sur le déplacement concerné, avec une tolérance de quelques mètres pour ne pas signaler les écarts
d'arrondi de coordonnées. Sans ce drapeau, un analyste ne peut plus distinguer un carnet troué par
une correction d'un carnet incohérent à la collecte. À rapprocher des checks de trous de séquence
qui existent déjà : eux signalent le trou, ce drapeau-ci l'explique.

### D. Réconciliation des coordonnées de lieu habituel

Famille à part, parce qu'elle est volumineuse, récurrente, et qu'aucune des corrections possibles
n'est automatisable. Le problème : les coordonnées du lieu habituel de travail ou d'études déclarées
dans la section personne diffèrent de celles de l'origine ou de la destination des déplacements dont
l'activité est justement ce lieu habituel.

L'agence sépare le cas en deux, puis le second en quatre.

Quand la personne n'a **aucune** coordonnée de lieu habituel mais que ses déplacements en ont une,
la correction est déterministe : on recopie celle des déplacements vers la personne. Deux
précautions retenues : privilégier la destination plutôt que l'origine, parce que seule la
destination porte le nom du lieu ; et vérifier qu'une personne allée deux fois au même endroit dans
la journée n'a pas deux coordonnées différentes. C'est le seul cas de cette famille qui puisse être
proposé automatiquement.

Quand les deux coordonnées existent et diffèrent, il faut d'abord **écarter les écarts
insignifiants** par un seuil de distance, sinon la liste est noyée par du bruit d'arrondi. Le reste
part en révision, et le réviseur choisit entre quatre issues : le motif du déplacement était faux et
devient « travail à un autre lieu » ; les coordonnées du déplacement sont fausses et prennent celles
du lieu habituel ; celles du lieu habituel sont fausses et prennent celles du déplacement, pour tous
ses déplacements ; ou aucune des deux n'est bonne et une nouvelle coordonnée est saisie. Un audit
check peut produire la liste, avec le seuil comme paramètre, mais pas trancher — voir
`P_L_UsualPlaceGeographyDiffersFromTripEnd` dans `mtmd_sas_external-validation-audit-checks.md`.

### E. Dérivation

Ce ne sont pas des corrections mais des calculs. Ils sont ici parce que l'agence les fait dans le
même programme, et parce que leur absence bloque des audits. Le détail est dans
`mtmd_sas_exports-field-mapping-todo.md` §2.

Statut de répondant par personne, type de conducteur, type de jonction déduit de la paire de modes
de part et d'autre du transfert, lignes de transport collectif éclatées en une colonne par ligne,
indicateurs jour par jour d'occupation en présentiel et à distance, lieu de départ du premier
déplacement.

Deux détails valent d'être retenus. Les indicateurs jour par jour utilisent un codage explicite qui
distingue le refus du sans-objet, exactement la distinction que l'applicabilité (#1916) doit
produire. Et une correction tardive du programme rétablit ce codage pour les refus, qui étaient
jusque-là comptés comme des « non » : confondre « a refusé » et « a répondu non » est une erreur
facile, et elle a survécu plusieurs versions.

### F. Imputation

Hors périmètre, mais à nommer pour clore la question. Genre imputé pour les personnes en âge de
répondre ayant refusé, à partir d'un traitement externe, avec un drapeau distinguant la valeur
imputée. Réponses « autre » de la question d'occupation reclassées à la main dans les vraies
catégories, avec au passage une catégorie qui n'existe pas dans la liste d'evolution, pour les cas où
le temps plein et le temps partiel sont indiscernables. C'est du travail statistique, il reste chez
l'agence. Le drapeau d'imputation, en revanche, est une bonne pratique à retenir : toute valeur créée
doit être distinguable d'une valeur déclarée.

## 3. Où doit vivre chaque correction

Quatre étages possibles, et le choix change tout :

1. **À la collecte.** Empêcher l'erreur plutôt que la corriger. L'ordre canonique des cases cochées
   relève de là. C'est le seul étage qui élimine le problème au lieu de le déplacer.
2. **En migration de données.** Un changement de liste de choix en cours d'enquête devrait migrer
   les valeurs déjà saisies, comme une migration de schéma. C'est aujourd'hui un angle mort complet.
3. **En révision, proposé au réviseur.** Tout ce qui touche la structure ou crée une valeur. Le
   réviseur décide, la décision est tracée, la correction va dans `corrected_response`.
4. **À l'export.** Ce qui ne sert qu'à régulariser le fichier livré, comme créer un segment
   `dontKnow` pour qu'aucun déplacement ne soit sans mode. Rien de ce qui touche la donnée collectée
   ne devrait se décider là.

Ma position : **rien d'automatique et silencieux sur la donnée collectée.** Une correction en masse
sans trace, comme les valeurs de mobilité réduite créées par inférence sur des dizaines de milliers
de personnes, est indéfendable même quand la règle est juste, parce que personne ne peut plus
distinguer la déclaration de la déduction. Les corrections déterministes doivent être *proposées*,
appliquées en un geste, et enregistrées.

## 4. Proposition : l'audit check qui sait se corriger

L'idée tient en un champ. Un audit check qui connaît la correction l'attache à son audit :

```ts
/** Deterministic correction a reviewer can apply in one click, when the check knows the fix. */
type SuggestedCorrection = {
    /** i18n key describing what applying the correction does */
    description: string;
    /** Paths and values to write in the corrected response */
    valuesByPath: { [path: string]: unknown };
};
```

Ce que ça donne, en reprenant l'inventaire du §2 : la valeur hors liste de choix propose la valeur
migrée, la ligne de transport collectif manquante propose `dontKnow`, le doublon de segments propose
lequel supprimer, l'activité en boucle sans destination propose la suppression et le passage de la
personne à non mobile. Le réviseur voit la règle, l'applique ou l'ignore, et la décision de révision
existe déjà pour la tracer.

Trois raisons de trouver ça élégant plutôt que gadget. Le calcul de la correction est au même endroit
que la détection du problème, donc ils ne peuvent pas diverger lors d'un changement de règle. Le
réviseur n'a plus à retrouver le champ dans l'arbre pour appliquer une correction dont la règle est
connue. Et les corrections d'un lot peuvent être appliquées en masse par une tâche pour les familles
jugées sûres, sans que le mécanisme change.

Trois questions ouvertes : est-ce que la correction s'écrit dans `corrected_response` ou dans une
troisième couche ; est-ce qu'un check peut proposer une suppression d'objet, qui demande la
réconciliation et la renumérotation, ou seulement des écritures de champs ; et est-ce qu'on marque
les valeurs issues d'une correction, sur le modèle du drapeau d'imputation du §2 F.

Sur cette dernière question, les rondes de correction donnent une réponse à considérer : l'agence
ajoute, à côté de la variable corrigée, une colonne dont la valeur dit *laquelle* des règles a été
appliquée. Pas seulement « cette valeur a été corrigée », mais « corrigée par telle règle », ce qui
permet six mois plus tard de recompter les cas d'une règle donnée ou de la défaire. Si on marque les
corrections, c'est ce niveau de détail qui est utile, et le code d'erreur du check qui a proposé la
correction le fournit déjà gratuitement.

## 5. TODO

- [ ] Valider le principe du §3, en particulier « rien d'automatique et silencieux sur la donnée
      collectée », avant de discuter du mécanisme.
- [ ] Trancher les trois questions ouvertes du §4.
- [ ] Créer l'issue du check générique de valeur hors liste de choix, avec la migration au
      changement de liste comme volet distinct.
- [ ] Vérifier si le mécanisme de suppression et réconciliation de `deleteVisitedPlace` est
      utilisable depuis la révision, ou s'il est lié au flux du questionnaire.
- [ ] Documenter, pour chaque correction du §2, si elle relève d'evolution ou de l'agence, et
      soumettre la liste aux agences : ce sont elles qui savent lesquelles elles veulent continuer à
      faire.
- [ ] Instruire avec l'agence le cas des occupations inférées aux enfants d'âge scolaire avant d'en
      faire une règle.
