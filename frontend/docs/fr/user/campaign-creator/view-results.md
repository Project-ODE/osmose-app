# Voir les résultats de la campagne

Pour visualiser les résultats, vous devez accéder à une campagne.

![](/campaigns/campaign-detail.png)

Tous les détails de la campagne se trouvent ici.
Pour plus d'informations à ce sujet, lisez la
section [Annotation > Détail de la campagne](../campaign.md#detail-de-la-campagne).

Vous pouvez accéder à la progression détaillée ("Detailed progression") de tous les annotateurs.

![](/campaign-creator/annotator-progression.png)

À partir de là, vous pouvez télécharger les fichiers CSV des résultats et du statut.

### Résultats

Un tableau contenant toutes les annotations et tous les commentaires laissés par les annotateurs de la campagne.

| Colonne                    |          Type          | Description                                                     |
|----------------------------|:----------------------:|-----------------------------------------------------------------|
| dataset                    |         string         | Nom du dataset                                                  |
| filename                   |         string         | Nom du fichier                                                  |
| start_time                 |         float          | Début relatif de l'annotation                                   |
| end_time                   |         float          | Fin relative de l'annotation                                    |
| start_frequency            |          int           | Fréquence minimum de l'annotation                               |
| end_frequency              |          int           | Fréquence maximum de l'annotation                               |
| annotation                 |         string         | Label de l'annotation                                           |
| annotator                  |         string         | Auteur de l'annotation ou du commentaire                        |
| start_datetime             |       timestamp        | Début absolut de l'annotation                                   |
| end_datetime               |       timestamp        | Fin absolue de l'annotation                                     |
| is_box                     |        boolean         | Si l'annotation est une boîte ou une présence                   |
| confidence_indicator_label |         string         | Nom de l'indice de confiance (s'il existe)                      |
| confidence_indicator_level | string<br/>[int]/[int] | Niveau de confiance / Niveau maximum de confiance (s'il existe) |
| comments                   |         string         | Commentaire laissé par l'annotateur                             |

::: danger TODO
add acoustic features
:::

### Status

Un tableau indiquant l'état de la soumission pour tous les fichiers et par tous les annotateurs.

| Colonne      |                  Type                  | Description                                                      |
|--------------|:--------------------------------------:|------------------------------------------------------------------|
| dataset      |                 string                 | Nom du dataset                                                   |
| filename     |                 string                 | Nom du fichier                                                   |
| [Annotators] | UNASSIGNED <br/>CREATED <br/> FINISHED | State of submission of the annotator (column) on the file (line) |

::: danger TODO
add acoustic features
:::