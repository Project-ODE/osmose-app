# Campagnes d'annotations

APLOSE regroupe les sessions d'annotation sous le terme de "Annotation Campaign" (campagne d'annotation).
Chaque campagne est liée à un dataset et à un ou plusieurs annotateurs.

Une campagne peut être configurée pour présenter différentes configurations de spectrogrammes, annoter différents label
et même valider des sorties de détecteurs.

## Vue d'ensemble des campagnes

Vous pouvez visualiser toutes vos campagnes sur la page "Annotation campaigns".
![](/campaigns/all-campaigns_user.png)

Vous pouvez rechercher une campagne par son nom ou filtrer la liste par le type de campagne (campaign mode) : créer des
annotations ou vérifier la sortie des détecteurs.

Chaque campagne est décrite par son nom, le jeu de données à annoter, le type (créer des annotations ou vérifier les
sorties de détecteurs).
Votre progression et la progression globale sur la campagne est visible sur chaque carte.

Vous pouvez accéder au détail de la campagne en cliquant sur sa carte.

## Détail de la campagne

![](/campaigns/campaign-detail.png)

### Information sur la campagne

Vous pouvez lire ici l'objectif de la campagne dans sa description (si elle est remplie).

Le panneau latéral droit affiche toutes les informations relatives à la campagne :

| Information               | Description                                                                                                                                            |
|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| Deadline                  | Date limite d'annotation                                                                                                                               |
| Annotation mode           | Le type de campagne : créer des annotations ou vérifier la sortie des détecteurs                                                                       |
| Dataset                   | Jeu de donnée à annoter                                                                                                                                |
| Spectrogram configuration | Paramètres utilisés pour générer les spectrogrammes disponibles. Ils peuvent être utilisés pour recréer la campagne                                    |
| Audio metadata            | Métadonnées du segmentation audio. Elles peuvent être utilisés pour recréer la campagne                                                                |
| Label set                 | Nom de l'ensemble de labels utilisés pour l'annotation.                                                                                                |
| Confidence indicator set  | Nom de l'ensemble d'indicateurs de de confiance. L'indicateur de confiance permet à l'annotateur de définir son niveau de confiance sur son annotation |
| Detailed progress         | Montre la progression de chaque annotateur sur la campagne                                                                                             |

### Fichiers à annoter

La page “Annotation files” répertorie les fichiers qui vous ont été attribué pour l'annotation. Vous pouvez rechercher
un fichier spécifique ou n'afficher que les fichiers non soumis ou les fichiers avec annotations, ou filtrer parmi les
labels présents. Vous pouvez également reprendre directement l'annotation (bouton "Resume annotation"), ce qui vous
amènera au premier fichier non soumis.

Le tableau des fichiers contient les colonnes suivantes :

| Column      | Description                                                                                                                                                                        |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Filename    | Nom du fichier                                                                                                                                                                     |
| Date        | Début de l'enregistrement                                                                                                                                                          |
| Duration    | Durée de l'enregistrement                                                                                                                                                          |
| Annotations | Suivant le type de campagne : <br/> - Création d'annotation : nombre d'annotation que vous avez soumis<br/> - Validation de sorties de détecteurs : nombre d'annotations à valider |
| Status      | Vous avez déjà soumis vos annotations ou non                                                                                                                                       |
| Access      | Un accès direct pour [annoter](./annotator) ce fichier                                                                                                                             |

