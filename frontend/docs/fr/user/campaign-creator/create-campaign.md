# Créer une campagne d'annotation

Pour créer une campagne d'annotation, cliquez sur le bouton "New annotation campaign".

![](/campaigns/all-campaigns_campaign-admin.png)

## Informations générales

Vous pouvez remplir les informations générales.

![](/campaign-creator/form-global.png)

- Name : Nom de la campagne. Seul le nom est requis.
- Description : La description peut aider votre annotateur à comprendre l'objectif de cette campagne par exemple.
- Instruction URL : Si vous avez une page web ou un PDF stocké en ligne, vous pouvez indiquer son URL dans le champ «
  Instruction URL ». Elle sera accessible aux annotateurs de la campagne
- Deadline : La date limite pour annoter la campagne sera également accessible aux annotateurs.

## Données

Vous pouvez ensuite sélectionner l'ensemble de données à annoter.

![](/campaign-creator/form-data.png)

Vous pourrez choisir une ou plusieurs configurations de spectrogrammes parmi celles disponibles pour le dataset
sélectionné.

## Annotation

Vous pouvez sélectionner le mode d'annotation dont vous avez besoin :

- Create annotations : créer de nouvelles annotations sur une campagne vide
- Check annotations : valider et invalider les annotations, à partir de la sortie d'un détecteur par exemple.

![](/campaign-creator/form-annotation.png)

### Mode de création d'annotations

Si vous choisissez le mode "Create annotations", vous devrez sélectionner un ensemble de labels (voir la section
détaillée ci-dessous pour créer un nouvel ensemble de labels).
Vous pouvez également sélectionner un ensemble d'indicateurs de confiance (voir la section détaillée ci-dessous pour
créer un nouvel ensemble d'indicateurs de confiance).

![](/campaign-creator/form-annotation-create.png)

Une fois la sélection effectuée, les informations relatives à l'ensemble de labels s'affichent. Vous pouvez choisir
d'activer les « caractéristiques acoustiques » pour certains labels (cf. labels (
voir [Annotation/Caractéristiques acoustiques](../annotator.md#caracteristiques-acoustiques))

::: details Créer un jeu d'étiquettes

Accédez à la partie administration de APLOSE en cliquant sur le lien "Admin".

Cherchez "Label sets" dans le bloc "API" et cliquez sur "Add".

![](/campaign-creator/label-set/nav.png)

Vous pouvez remplir le formulaire avec le nom de votre ensemble (Name), le propriétaire (owner), et sélectionner les
labels dont vous avez besoin pour vos campagnes d'annotation.
Si vous ne trouvez pas les labels souhaités, vous pouvez cliquer sur le bouton « + » près de la liste des labels pour en
créer un nouveau.

![](/campaign-creator/label-set/form.png)

Lorsque votre formulaire est rempli, vous pouvez le sauvegarder (save).

:::

::: details Créer un ensemble de confiance

Accédez à la partie administration de APLOSE en cliquant sur le lien "Admin".

Cherchez "Confidence indicator set" dans le bloc "API" et cliquez sur "Add".

![](/campaign-creator/confidence-set/nav-set.png)

Vous pouvez remplir le formulaire avec le nom de votre set (name) et le sauvegarder (save).

![](/campaign-creator/confidence-set/form-set.png)

Vous pouvez ensuite rechercher les "Confidence indicators" dans le bloc "API" et "Add" pour ajouter autant d'indicateurs
de confiance que nécessaire.

![](/campaign-creator/confidence-set/nav-indicator.png)

Pour chaque indicateur, vous devez renseigner le nom (label), le niveau (level) et l'ensemble associé (included in this
set) que vous venez de créer.
Vous pouvez définir un indicateur comme indicateur par défaut pour votre ensemble en cochant la case "is default".

![](/campaign-creator/confidence-set/form-indicator.png)

:::

### Mode vérification des annotations

Avec le mode "Check annotations", il vous sera demandé d'importer des annotations.

![](/campaign-creator/form-annotation-check.png)

Une modale s'ouvrira pour vous permettre d'importer réellement vos annotations.

![](/campaign-creator/form-annotation-check-importcsv.png)

Vous pouvez soit cliquer sur la zone "Import annotations", soit y glisser un fichier. Le fichier doit être un csv avec
les colonnes suivantes :

| Colonne                    |          Type          | Description                                                                                               |
|----------------------------|:----------------------:|-----------------------------------------------------------------------------------------------------------|
| dataset                    |         string         | Nom du dataset. S'il ne correspond pas au dataset de la campagne, vous aurez le choix de le garder ou non |
| start_datetime             |       timestamp        | Début de l'annotation                                                                                     |
| end_datetime               |       timestamp        | Fin de l'annotation                                                                                       |
| start_frequency            |          int           | Fréquence minimum de l'annotation                                                                         |
| end_frequency              |          int           | Fréquence maximum de l'annotation                                                                         |
| annotation                 |         string         | Label de l'annotation                                                                                     |
| annotator                  |         string         | Détecteur aillant créé l'annotation                                                                       |
| is_box                     |        boolean         | Si l'annotation est une boîte ou une présence                                                             |
| confidence_indicator_label |         string         | Nom de l'indice de confiance (s'il existe)                                                                |
| confidence_indicator_level | string<br/>[int]/[int] | Niveau de confiance / Niveau maximum de confiance (s'il existe)                                           |

Dans le cas de présences, la date de début/fin et la fréquence de début/fin doivent être celles du fichier.

Après avoir soumis votre fichier, vous devrez configurer les détecteurs tels qu'ils seront enregistrés dans la base de
données.

![](/campaign-creator/form-annotation-check-detector.png)

Il vous sera demandé d'affecter les détecteurs du CSV à un détecteur existant ou d'en enregistrer un nouveau (Create).
Ici, vous pouvez également sélectionner uniquement les détecteurs que vous souhaitez vérifier, au cas où le fichier en
contiendrait plusieurs.

Vous pouvez ensuite spécifier chaque configuration de détecteur (existante ou nouvelle).

![](/campaign-creator/form-annotation-check-detectorconfig.png)

Lorsque vous avez terminé, vous pouvez cliquer sur "Import". Les détecteurs sélectionnés seront affichés sur la page.
Vous pouvez revoir la sélection à tout moment.
Si vous souhaitez la modifier complètement, vous pouvez cliquer sur le bouton « poubelle » et importer un nouveau
fichier.

![](/campaign-creator/form-annotation-check-imported.png)

## Annotateurs

Dans la dernière partie du formulaire, vous pourrez ajouter des annotateurs à votre campagne.
Pour chaque annotateur, vous pouvez spécifier la plage de fichiers qu'il peut annoter. Vous pouvez définir deux plages
différentes pour le même
annotateur.
Vous pouvez ajouter un nouvel annotateur à l'aide de la fonction de recherche.

![](/campaign-creator/form-annotator.png)

::: info

Vous pourrez ajouter des annotateurs ou des fichiers à un annotateur à tout moment

:::

## Enregistrer

Vous êtes prêt et pouvez soumettre votre nouvelle campagne en cliquant sur le bouton "Create campaign".
Après avoir soumis votre nouvelle campagne, elle devrait apparaître dans la liste des campagnes d'annotations.

