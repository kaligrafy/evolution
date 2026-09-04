# Audit checks à ajouter, d'après les programmes de validation externes

## Objectif

Les agences qui exploitent les données d'enquête les valident et les corrigent après coup, avec des
programmes statistiques externes. Le MTMD nous a donné accès à ses programmes SAS pour deux enquêtes
régionales récentes : un programme de fusion et de contrôle, un programme de validation détaillée
variable par variable, et un programme de corrections systématiques.

Ces documents décrivent des programmes, pas les personnes qui les ont écrits : aucun nom d'employé,
aucune adresse, aucun identifiant d'entrevue, aucun décompte de cas des enquêtes analysées.

Ce document recense ce qu'evolution devrait détecter lui-même. Le but n'est pas de rejouer ces
enquêtes-là, c'est que les prochaines soient auditées et corrigées dans evolution, par le réviseur,
au lieu de l'être des mois plus tard dans un outil externe que personne d'autre ne peut relire.

Deux documents complètent celui-ci :

- `mtmd_sas_auto-corrections.md` : les corrections déterministes, quand la règle est connue d'avance.
- `mtmd_sas_exports-field-mapping-todo.md` : les noms de colonnes et les variables dérivées de l'export.

## Comment lire ce document

**Aucun décompte de cas.** Les programmes analysés portent sur des enquêtes dont les questionnaires
diffèrent des nôtres actuels, et leurs volumes ne diraient rien d'utile sur les prochaines. Les
colonnes « fréquence » donnent seulement un ordre de grandeur observé ailleurs, pour aider à
prioriser :

- **généralisé** : touche une part visible des enregistrements, donc probablement un défaut de
  conception plutôt que des saisies isolées ;
- **récurrent** : revient à chaque version du traitement, en nombre modéré ;
- **isolé** : quelques cas, mais que l'agence sort quand même à chaque fois pour les regarder.

**Les champs sont à confirmer.** Plusieurs questions de ces enquêtes n'existent plus, et d'autres ont
été ajoutées depuis. La colonne « champs requis » nomme les attributs du modèle d'objets d'evolution
quand ils existent, et signale ce qui manque. Avant d'implémenter un check, il faut confirmer que le
champ est bien collecté dans les questionnaires courants : enquêtes nationales en cours, `od_mtl`, et
les nouveautés à venir. Le §5 rassemble cette vérification.

Codes proposés selon la convention `[PREFIXE]_[TYPE]_[Description]` de `checks/README.md` :
`I` interview, `HH` ménage, `HM` domicile, `P` personne, `J` carnet, `VP` lieu visité, `T`
déplacement, `S` segment ; `M` manquant, `I` invalide, `L` logique, `W` avertissement, `F` info.

## 1. Déjà couvert

Les 47 checks de `packages/evolution-backend/src/services/audits/auditChecks/checks/` couvrent déjà
ce que les programmes externes vérifient sur la structure : taille du ménage manquante ou
incohérente avec le nombre de personnes, nombre de véhicules manquant, véhicules trop nombreux par
détenteur de permis, doublons et trous de séquence aux quatre niveaux, déplacement sans segment,
mode manquant, âge manquant ou aberrant, domicile hors territoire, format du code d'accès, dates
d'entrevue hors période d'enquête, nombres de vélos et de vélos électriques.

Les issues ouvertes couvrent une bonne part du reste : #1908 et #1909 (code d'accès absent de la
liste d'envoi et aide au réviseur), #1910 et #1911 (doublons de personnes), #1912 à #1915 (mobilité
déclarée contre carnet réel, et âge interviewable), #1916 (applicabilité des questions), #1918 à
#1922 et #1924 (carnet incomplet et chronologie), #1925 et #1926 (durées d'entrevue).

## 2. Checks candidats

### Entrevue et ménage

| Code proposé | Règle | Fréquence | Champs requis, état dans le cœur | Priorité |
| --- | --- | --- | --- | --- |
| `X_I_ValueNotInCurrentChoiceList` | Valeur stockée absente de la liste de choix courante du widget, quel que soit l'objet | non mesurée, mais la cause est structurelle | Aucun champ nouveau : il faut accéder à la liste de choix du widget depuis l'audit | **Haute** |
| `X_L_DetailAnsweredWhileGatingQuestionSaysNo` | Une question de détail est renseignée alors que la question filtre qui la conditionne répond « non », ou l'inverse : le filtre dit « oui » et aucun détail n'est donné | récurrent, et dans les deux sens | Aucun champ nouveau, mais il faut connaître le lien filtre-détail, donc c'est le même mécanisme que #1916 | Haute : générique, et attrape une famille entière plutôt qu'un cas |
| `I_I_AccessCodeSharedBySeveralInterviews` | Le même code d'accès sert à plusieurs entrevues | récurrent | `accessCode` existe ; demande des checks entre entrevues (#1595) | Moyenne |
| `I_L_StrataMismatchWithSampleFrame` | La strate déclarée diffère de celle de la base de sondage | isolé | Dépend des données de préremplissage, propre à chaque enquête | Basse |
| `J_L_StartDateNotMatchingAssignedDate` | La date du carnet ne correspond pas à la date assignée à l'entrevue | invariant vérifié aux deux enquêtes | `Interview.assignedDate` et `Journey.startDate` existent | Moyenne |
| `HH_L_DisabilityIndicatorWithoutPersonWithDisability` | Le ménage déclare au moins un membre à mobilité limitée mais aucune personne n'est marquée | récurrent : l'agence doit coder une valeur sentinelle pour ces ménages au moment de compter les personnes concernées | `Household.atLeastOnePersonWithDisability` et `Person.hasDisability` existent | Moyenne |
| `HH_W_SizeVeryLarge` | Ménage anormalement grand, seuil configurable | isolé | `Household.size` existe | Basse |
| `HH_W_UnknownMobilityShareTooHigh` | Part trop élevée de personnes à mobilité inconnue dans le ménage, seuil configurable | récurrent, et motif d'invalidation manuelle au-delà d'un seuil élevé | `Journey.didTrips` existe | Moyenne |
| `HH_F_SinglePersonWithKnownMobility` | Ménage de plusieurs personnes dont une seule a une mobilité connue | récurrent, conservé pour la pondération | Idem, drapeau informatif | Basse |

### Personne

| Code proposé | Règle | Fréquence | Champs requis, état dans le cœur | Priorité |
| --- | --- | --- | --- | --- |
| `P_L_NonMobileWithDeclaredDeparture` | Personne déclarée non mobile alors qu'un lieu de départ est déclaré | isolé mais parfaitement net | `Journey.didTrips` existe ; **le lieu de départ du premier déplacement n'existe pas** dans le modèle | Moyenne |
| `P_L_DepartureLocationInconsistent` | Départ déclaré ailleurs qu'au domicile sans lieu précisé, ou l'inverse | récurrent avant corrections | Même champ manquant | Basse |
| `P_L_FirstTripOriginNotMatchingDeparture` | L'origine du premier déplacement ne correspond pas au lieu de départ déclaré | **généralisé** | Même champ manquant. L'écart était assez large pour que l'agence abandonne la variable : à instruire avant d'implémenter, la question de départ est peut-être mal comprise | Moyenne |
| `P_L_WorkTypeInconsistentWithOccupation` | Lieu de travail renseigné pour un non-travailleur, ou lieu d'études pour un non-étudiant | aucun cas, mais l'invariant vaut d'être gardé | `occupation`, `workerType`, `workPlaceType`, `studentType`, `schoolPlaceType` existent | Basse |
| `P_W_SameDayOnSiteAndRemote` | Même journée déclarée à la fois en présentiel et à distance | récurrent, presque uniquement chez les hybrides | `Journey.previousWeekRemoteWorkDays` et `previousWeekTravelToWorkDays` existent | Basse, `warning` : plausible en demi-journées, à discuter |
| `P_L_TransitPassWithoutOperator` | Titre de transport déclaré sans organisme | isolé | `transitPassOwnership` et `transitPasses` existent ; **l'organisme n'est pas un champ distinct**, à confirmer | Basse |
| `P_L_ProxyInconsistentWithConsent` | Le répondant désigné contredit le régime de consentement : aucun répondant attendu mais un est désigné, ou l'inverse | récurrent, et souvent un effet de bord des corrections en mode réviseur | `whoWillAnswerForThisPerson` et `isProxy` existent ; **le consentement parental n'est pas dans le modèle**, à confirmer | Moyenne |
| `P_M_UsualPlaceGeography` | Travailleur sur site ou hybride sans géographie de lieu de travail habituel, et l'équivalent pour les études | récurrent, et bloquant : ces coordonnées servent à compléter les extrémités de déplacement, voir §3 | `workPlaceType`, `studentType`, `schoolPlaceType` et les lieux composés existent ; od_mtl a déjà un check équivalent, candidat au portage | Haute |
| `P_L_UsualPlaceGeographyWithoutMatchingOccupation` | Géographie de lieu habituel présente chez quelqu'un dont l'occupation ne le justifie pas | isolé, et s'explique par des questions ajoutées en cours de collecte | Mêmes champs | Basse |
| `P_L_UsualPlaceGeographyDiffersFromTripEnd` | La géographie du lieu habituel de travail ou d'études diffère de l'extrémité des déplacements dont l'activité est ce même lieu habituel | récurrent, sur travail comme sur études | Mêmes champs, plus `VisitedPlace.activity` et `geography`. Demande un **seuil de distance paramétrable** pour écarter le bruit d'arrondi, sinon le check est inutilisable | Haute |
| `P_F_OtherSpecifyNotRecoded` | Réponse « autre » avec champ texte rempli, jamais reclassée | généralisé | `modeOtherSpecify`, `schoolTypeOtherSpecify`, `noWorkTripReasonSpecify`, etc. existent | Moyenne, informatif |

### Carnet, lieux visités et déplacements

| Code proposé | Règle | Fréquence | Champs requis, état dans le cœur | Priorité |
| --- | --- | --- | --- | --- |
| `J_L_NoTripReasonWithoutMatchingOccupation` | Motif de non-déplacement pour le travail chez un non-travailleur, ou pour les études chez un non-étudiant | récurrent : l'agence a dû ajouter un nettoyage après la livraison, en découvrant que la question avait été posée trop largement | `Journey.noWorkTripReason` et `noSchoolTripReason` existent, avec `occupation` | Moyenne, relève de #1916 |
| `J_L_VisitedPlaceCountNotMatchingTripCount` | Le nombre de lieux visités doit valoir le nombre de déplacements plus un | énoncé comme invariant | Rien à ajouter | Moyenne |
| `T_L_OriginNotMatchingPreviousDestination` | L'origine d'un déplacement n'est pas la destination du précédent | invariant non garanti : les checks de séquence comparent les numéros, pas le chaînage par uuid | Rien à ajouter, complète #1922 | Moyenne |
| `T_W_ZeroDuration` | Déplacement de durée nulle | généralisé | `startTime` et `endTime` existent | Moyenne |
| `T_L_SameDepartureTimeAsAnotherTrip` | Deux déplacements d'une personne partent à la même heure | récurrent, et demande explicite de l'agence | Idem | Moyenne |
| `T_W_TimeAtDayBoundary` | Départ ou arrivée à la borne exacte de la journée d'enquête, souvent avec durée nulle | récurrent | Bornes de journée à rendre configurables | Basse |
| `T_W_DurationVeryLong` | Déplacement plus long qu'un seuil configurable | récurrent, surtout sur les activités en boucle | Idem | Basse |
| `T_W_BirdDistanceImplausibleForMode` | Distance à vol d'oiseau entre origine et destination incompatible avec le mode : trop longue pour un mode actif, ou quasi nulle alors que la durée déclarée est longue | récurrent : l'agence ajuste une loi sur la distribution observée des distances à pied et à vélo, puis sort les cas extrêmes par centile | Géographies des deux extrémités ; od_mtl a un check de vitesse plausible à porter. La leçon utile : les seuils devraient venir de la distribution observée, pas de constantes écrites au jugé | Moyenne |
| `T_W_ManySegments` | Déplacement à plus de N segments, seuil configurable | isolé, mais sorti à chaque version | Rien à ajouter | Basse |
| `VP_I_GeographyNotInSurveyTerritory` | Lieu visité hors territoire d'enquête | récurrent, et motif de reclassement en non mobile | Existe pour le domicile (`HM_I_geographyNotInSurveyTerritory`), à généraliser | Moyenne |
| Famille « activités en boucle » | Trois volets : boucle en premier ou dernier lieu du carnet, boucle dont les deux extrémités diffèrent, boucle ancrée ailleurs qu'au domicile ou au lieu de travail | récurrent | `activity` et `activityCategory` existent ; la notion de boucle existe déjà dans le questionnaire | Moyenne, un issue à trois volets |
| Volet 2 de #1920 | Un lieu non final porte une catégorie de lieu suivant, alors qu'elle ne devrait clore que le carnet | récurrent | **`nextPlaceCategory` n'est pas exposé** sur `VisitedPlace`, voir #1920 | Haute |

### Segment

| Code proposé | Règle | Fréquence | Champs requis, état dans le cœur | Priorité |
| --- | --- | --- | --- | --- |
| `T_L_BridgeOrFerryAnswerWithoutMatchingMode` | La question de franchissement répond « traversier » alors qu'aucun segment n'a un mode traversier | **généralisé, le plus fort volume relevé** | **Aucun attribut de pont ou traversier** dans le modèle : propre à l'enquête pour l'instant, à confirmer | Haute si le champ existe encore |
| `T_L_CrossingAnswerInconsistentWithGeography` | La question de franchissement contredit la géographie : franchissement déclaré alors que les deux extrémités sont du même côté de l'obstacle, ou aucun franchissement déclaré alors qu'elles sont de part et d'autre | récurrent dans les deux sens, et l'agence corrige la variable d'après la géographie plutôt que d'après la déclaration | Géographies des deux extrémités, plus un découpage du territoire par rapport à l'obstacle. Complète le check de mode ci-dessus : celui-là valide contre la géographie, pas contre les modes | Haute si le champ existe encore |
| `S_L_FerryWithVehicleWithoutVehicleSegment` | Traversier avec véhicule sans segment automobile avant ou après | isolé | `mode` existe | Basse |
| `S_M_Driver` | Mode passager sans conducteur déclaré | récurrent | `driverType` et `driverUuid` existent, **déjà séparés proprement** contrairement au champ unique de ces enquêtes | Moyenne, facile |
| `S_L_DriverTypeInconsistentWithMode` | Le type de conducteur contredit le mode : chauffeur de taxi, transport adapté, transport à la demande | récurrent, corrigé systématiquement par l'agence | `driverType`, `mode`, `onDemandType` existent | Moyenne, et candidat à la correction proposée |
| `S_L_TransitLineMissingOnTransitSegment` | Segment de transport collectif sans ligne déclarée | isolé | `busLines` existe, **déjà un tableau** | Basse |
| `S_M_VehicleOccupancy` | Occupation du véhicule non renseignée alors que la question s'appliquait | récurrent | `vehicleOccupancy` et `isProxy` existent ; la condition dépend du statut de répondant | Moyenne, relève de #1916 |
| `S_M_PaidForParking` | Stationnement payant non renseigné alors que la question s'appliquait | récurrent | `paidForParking` existe, mais **la condition porte sur un motif de déplacement dérivé qui n'existe pas** : l'agence a renoncé à reproduire la règle pour cette raison | Bloqué par le motif dérivé |
| `S_L_ConsecutiveSegmentsSimilar` | Deux segments consécutifs de même mode, identiques ou ne différant que par un champ rempli sur un seul des deux | récurrent | `mode` et les autres attributs de segment ; voir `mtmd_sas_auto-corrections.md`, la règle de fusion est connue | Moyenne |
| `S_L_JunctionMissingForIntermodalTransfer` | Transfert entre un mode privé et un mode collectif ou externe sans information de jonction | récurrent | **Aucun attribut de jonction** : type de stationnement, nom du parc incitatif, géographie du point de transfert. À ajouter si on veut auditer les jonctions | Moyenne |
| `S_L_JunctionDescriptionWithoutParkAndRide` | Nom de stationnement renseigné alors que le type n'est pas un parc incitatif | isolé | Mêmes attributs manquants | Basse |
| `S_I_JunctionNameNotInReferential` | Nom de lieu choisi dans une liste, mais la liste ne permet pas de retrouver le lieu | récurrent : l'agence localise les jonctions en rattachant après coup des coordonnées aux noms de la liste, et une entrée apparaissant deux fois l'a forcée à choisir arbitrairement | Une liste de choix de lieux nommés devrait être un référentiel à clés uniques portant la géographie, pas une liste d'étiquettes | Moyenne |
| `S_L_TransitAccessModeWithoutTransitMode` | Mode d'accès au transport collectif répondu alors que le mode n'en est pas un | récurrent | À confirmer : ce champ a peut-être disparu depuis | Basse, relève de #1916 |

## 3. Checks existants à revoir

- **`VP_M_Geography` et les lieux d'ancrage.** Ces enquêtes ne stockent pas de coordonnées sur les
  lieux visités de type domicile ou lieu de travail habituel : la géographie vit dans la section
  domicile ou sur le profil de la personne. Le programme de finalisation le confirme sans ambiguïté :
  il doit compléter les coordonnées d'origine et de destination pour près de la moitié des extrémités
  de déplacement, en allant chercher la géographie du domicile du ménage ou du lieu habituel de la
  personne selon l'activité, et il ne reste ensuite qu'une poignée de trous, tous sur des activités
  sans lieu fixe. Autrement dit, le repli n'est pas un cas limite, c'est le cas courant.
  Côté evolution, `VisitedPlaceFactory` (lignes 63-97)
  rattache bien l'objet `Home` aux lieux d'activité domicile, donc le domicile est couvert. Mais les
  branches qui lisent `person.workPlaces[0]` et `schoolPlaces[0]` sont mortes en pratique :
  `setupWorkAndSchoolPlaces()` est appelé « after all visited places are created »
  (`PersonFactory.ts:90`), donc les tableaux sont vides au moment du rattachement. Le check ne tient
  que parce que le questionnaire recopie la géographie du lieu habituel sur le lieu visité
  (`widgetsGeography.ts:270-275`). Faux positifs attendus sur les données importées, les entrevues
  incomplètes, et si la saisie en ligne des lieux habituels est activée. Le repli de
  `getVisitedPlaceGeography` (`odSurvey/helpers.ts:1197`) n'a pas d'équivalent côté serveur, alors
  que le contexte d'audit porte déjà `home`, `person` et `interview`.
- **`HH_M_AtLeastOnePersonWithDisability`** exclut déjà les ménages d'une personne
  (`HouseholdAuditChecks.ts:354`), ce qui correspond exactement à la règle de ces questionnaires. Ce
  qui manque est l'inverse, listé au §2.
- **`P_M_Age`** n'a rien à changer : ces enquêtes acceptaient un groupe d'âge en repli d'un refus,
  mécanique qu'evolution ne reproduit pas et ne veut pas reproduire. L'âge commande la plupart des
  questions posées à une personne, donc un âge vide n'est pas un refus tolérable mais une erreur qui
  rend une partie du questionnaire inexploitable. À noter que `ageGroup` figure encore dans
  `personAttributes` (`Person.ts:41`) alors que l'attribut est déprécié.

## 4. Quatre besoins transversaux, aucun n'est un audit check

C'est le vrai enseignement des trois programmes : les checks manquants se comptent en dizaines, mais
quatre manques structurels expliquent la majorité du travail fait à l'extérieur.

**L'applicabilité des questions (#1916).** Une bonne moitié des analyses consiste à établir qu'une
valeur manquante l'est pour la bonne raison, et chaque fois il faut un test pour le démontrer. Les
conditions relevées ne sont pas toutes des seuils d'âge : elles portent aussi sur la possession d'un
permis, sur le mode du segment, sur l'activité de destination, sur le statut de répondant, et jusque
sur la géographie : la question de franchissement est sans objet dès qu'une extrémité du déplacement
sort du territoire d'enquête, ou que le déplacement est une tournée sans destination fixe. Le
mécanisme doit accepter une condition, pas seulement un âge. Et il lui faut une fenêtre de validité :
plusieurs questions ont été ajoutées en cours d'enquête, et les réponses manquantes d'avant l'ajout
ne sont pas des erreurs. Un check d'applicabilité sans date de validité crierait sur toute la
première partie de la collecte.

**Les variables dérivées.** Motif de déplacement regroupé, mode regroupé, type de jonction, nombre de
déplacements par personne ou par ménage : chacune est recalculée à l'extérieur, et leur absence
bloque des audits, comme le stationnement payant au §2. Détail dans
`mtmd_sas_exports-field-mapping-todo.md`.

Les rondes de correction ajoutent l'argument décisif contre le stockage de ces valeurs : **une
dérivée stockée devient périmée dès qu'on corrige en amont, et rien ne le signale.** Deux cas
observés dans la même enquête. L'imputation des modes manquants n'a pas rafraîchi la famille de
mode qui s'en déduit, donc plusieurs centaines de déplacements ont été livrés sans les jonctions
intermodales qu'ils auraient dû porter, et l'erreur n'est apparue que deux versions plus tard, par
hasard, en examinant des jonctions invalides. Puis un mode a changé de famille en cours d'analyse, ce
qui a forcé le recalcul de tous les types de jonction et de leur décompte. Même chose à chaque
suppression d'objet : décomptes, clés et numéros de séquence sont refaits à la main. Une dérivée
devrait être un getter calculé sur l'arbre d'objets, et l'export la matérialise au moment de
produire le fichier — jamais l'inverse.

**Les métadonnées écrasées par la révision.** Le problème apparaît dans les trois programmes, et l'un
d'eux l'écrit noir sur blanc : quand un réviseur modifie une entrevue en mode interviewer, la date du
jour s'inscrit comme date de complétion. S'y ajoutent la liste des interviewers, qui perd le signal
« entrevue téléphonique » dès qu'une révision a lieu, et des numéros de séquence rendus invalides par
une tentative de correction. Réviser ne doit pas écrire dans les champs qui décrivent la collecte.

**Les valeurs orphelines d'une liste de choix modifiée.** Quand une liste de choix change en cours
d'enquête, les valeurs déjà saisies restent telles quelles et rien ne les migre. Un check générique
comparant la valeur stockée à la liste courante attraperait toute la famille d'un coup, y compris les
cas qu'on ne soupçonne pas, et la migration des valeurs au changement de liste est le volet complet
de la solution.

## 5. Champs à confirmer avant d'implémenter

État relevé dans le modèle d'objets d'evolution (`evolution-common/src/services/baseObjects/`), à
croiser avec les questionnaires courants.

**Existent dans le cœur**, donc les checks correspondants sont directement écrivables :
`Person.age`, `hasDisability`, `drivingLicenseOwnership`, `transitPassOwnership`, `transitPasses`,
`carsharingMember`, `occupation`, `workerType`, `workPlaceType`, `studentType`, `schoolPlaceType`,
`isOnTheRoadWorker`, `whoWillAnswerForThisPerson`, `isProxy`, `nickname` ;
`Household.size`, `carNumber`, `atLeastOnePersonWithDisability`, `incomeLevel`, `homeOwnership`,
`homeCarParkings` ;
`Journey.didTrips`, `previousWeekRemoteWorkDays`, `previousWeekTravelToWorkDays`,
`noWorkTripReason`, `noSchoolTripReason` ;
`VisitedPlace.activity`, `activityCategory`, `shortcut` ;
`Segment.mode`, `driverType`, `driverUuid`, `carType`, `vehicleOccupancy`, `paidForParking`,
`onDemandType`, `busLines`.

Deux bonnes nouvelles au passage : le conducteur est déjà séparé en un type et un uuid de personne,
là où ces enquêtes devaient déduire le sens d'un champ unique d'après la longueur de la valeur ; et
les lignes de transport collectif sont déjà un tableau, là où elles devaient découper une chaîne à
séparateurs.

**N'existent pas dans le cœur**, à confirmer question par question : est-ce que le questionnaire
courant pose encore la question, et alors faut-il l'ajouter au modèle ?

- [ ] Lieu de départ du premier déplacement, et le fait que le départ soit le domicile ou non.
- [ ] Consentement parental et son régime, dont dépendent plusieurs règles sur les enfants.
- [ ] Organisme de transport associé à un titre, distinct du type de titre.
- [ ] Attributs de jonction : type de stationnement au point de transfert, nom du parc incitatif,
      géographie du point de transfert.
- [ ] Franchissement d'un pont ou d'un traversier, si la question survit hors des enquêtes où la
      géographie l'impose.
- [ ] Mode d'accès au transport collectif.
- [ ] Catégorie de lieu suivant sur un lieu visité, déjà suivi par #1920.
- [ ] Motif de déplacement dérivé, qui bloque au moins un check et plusieurs exports.

## 6. Hors périmètre

- **La non-réponse partielle.** Revenu, type de propriété, genre : les refus sont légitimes et ne
  sont pas des erreurs. Les agences les traitent par imputation, avec un drapeau distinguant la
  valeur imputée de la valeur déclarée. Evolution n'a pas d'étage d'imputation ; question ouverte,
  est-ce qu'il devrait en avoir un.
- **Le recodage des champs « autre, précisez ».** C'est le poste le plus lourd de ces traitements, et
  il se fait par aller-retour vers un tableur. Un audit peut signaler les champs non traités (§2), la
  décision de reclassement reste humaine, mais l'outiller dans l'UI de révision éliminerait
  l'aller-retour.
- **Les variables de mécanique du questionnaire.** Plusieurs champs exportés ne servent qu'au
  déroulement de l'entrevue, et l'agence les analyse longuement avant de les écarter, avec cette
  remarque qui vaut pour nous : « je ne comprends pas à quoi servent ces variables ». C'est un
  problème de dictionnaire, traité dans `mtmd_sas_exports-field-mapping-todo.md`.
- **Les choix de fusion.** Quelle entrevue garder parmi des doublons de code d'accès, quelles
  personnes classer non mobiles, quels déplacements écarter : un audit signale, il ne tranche pas.

## 7. Prochaines étapes

- [ ] Confirmer la liste du §5 contre les questionnaires courants, et décider pour chaque champ
      manquant s'il entre dans le modèle ou reste propre à une enquête.
- [ ] Créer l'issue du check générique de valeur hors liste de choix, avec la migration au
      changement de liste comme volet distinct. C'est le meilleur rapport valeur sur effort de tout
      le lot.
- [ ] Créer l'issue des métadonnées de collecte préservées en révision.
- [ ] Instruire l'écart entre lieu de départ déclaré et origine du premier déplacement avant
      d'écrire le check : le volume observé suggère un problème de question, pas de saisie.
- [ ] Créer les issues des checks à priorité moyenne dont tous les champs existent déjà, en
      commençant par le conducteur et les segments consécutifs semblables.
