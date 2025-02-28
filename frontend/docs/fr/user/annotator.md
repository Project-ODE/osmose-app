# Annoter

Pour annoter un fichier vous devez accéder à une campagne puis soit sur "Resume annotation" pour reprendre l'annotation,
soit sur le lien d'accès direct à un fichier.

## Page d'annotation

![](/annotator/create-1.png)
![](/annotator/create-2.png)

Il s'agit de la page principale d'APLOSE. Elle vous permet d'annoter des enregistrements audio grâce à leurs
spectrogrammes.

### Visualisation des spectrogrammes

Le spectrogramme est présenté avec des axes de temps et fréquence.

Un sélecteur situé au-dessus du spectrogramme vous permet de choisir parmi les paramètres FFT disponibles pour votre
spectrogramme. Vous pouvez également utiliser différentes échelles de fréquence.

![](/annotator/spectro-config.png)

<!--@include: ../parts/frequency-scales.md-->

### Zoomer dans le spectrogramme

Une fonction de zoom est disponible, sur le temps uniquement. Vous pouvez zoomer à l'aide des boutons de zoom situés à
côté du sélecteur de configuration de spectrogramme ou à l'aide de la molette de la souris sur le spectrogramme.

![](/annotator/zoom.png)

Le zoom est discret : chaque niveau de zoom offre un spectrogramme pré-calculé, ce qui signifie que les niveaux de zoom
sont décidés par le créateur du jeu de donnée.

### Écouter le fichier audio

Vous pouvez écouter l'enregistrement grâce au bouton play/pause situé sous le spectrogramme (à gauche). Vous pouvez
définir la position temporelle à partir de laquelle vous souhaitez commencer l'écoute en cliquant sur le spectrogramme.

![](/annotator/audio.png)
::: tip Raccourci :keyboard:
La touche “espace” de votre clavier est un raccourci pour lire et mettre en pause le fichier audio
:::
::: tip Recommendation :bulb:
Utilisez un casque ou des écouteurs pour une meilleure qualité !
:::

À côté du bouton play/pause, vous pouvez choisir la vitesse de lecture (de 0,25x à 4x). Cela vous permet
d'entendre les hautes fréquences en ralentissant la lecture, ou les basses fréquences en l'accélérant.

::: warning Attention

Les fichiers ayant une fréquence d'échantillonnage très élevée peuvent ne pas être compatibles avec votre navigateur.
La limite de compatibilité dépend du navigateur.
Firefox a tendance à avoir la plus grande compatibilité.

:::

## Annoter

Nous distinguons plusieurs types d'annotations :

- Présence : un label est présent sur le fichier
- Boîte : un label est présent à cet endroit précis.

Pour chaque boîte, il y a une présence associée au même label.

::: details Bientôt

Nous envisageons d'ajouter bientôt l'annotation des points.

:::

Dans le cas où vous avez chargé un fichier déjà soumis, vos annotations précédentes vont apparaître et peuvent être
modifiée.

### Ajouter une présence

Vous pouvez ajouter une présence en cochant le label souhaité dans le bloc "Presence / Absence".

![](/annotator/weak.png)
::: tip Raccourci :keyboard:
Les touche de 1 à 9 de votre clavier sont des raccourcis vers les labels correspondants dans la liste
:::

Vous pouvez voir toutes vos annotations dans le bloc "Annotations". Dans cet exemple, nous avons les deux labels
sélectionnés.

![](/annotator/weak-list.png)

::: info Note

Si vous décochez une présence, toutes les annotations, présence et boîtes, effectuées à l'aide de ce label seront
supprimées.

:::

### Ajouter une boîte

Chaque présence ajoutée activera les labels liés pour une boîte dans le bloc "Labels list".
Dans ce bloc, vous pouvez sélectionner le label que vous souhaitez utiliser pour créer votre annotation.

![](/annotator/strong.png)

Pour créer une boîte, cliquez sur le spectrogramme et faites glisser sur la zone contenant le son qui vous intéresse.
Lorsque vous relâchez le clic, l'annotation est créée et sélectionnée.

![](/annotator/box.png)
<small>_Ceci est un exemple_</small>

Dans l'en-tête de l'annotation, vous pouvez voir :

- Un bouton de lecture pour écouter votre annotation
- Le label associé
- Un indicateur de commentaire (voir la section commentaire ci-dessous)
- Un bouton pour supprimer votre annotation

Les boîtes sont listées dans le bloc "Annotations".
Chaque boîte se trouve en dessous de la présence correspondante.

![](/annotator/strong-list.png)

Dans la liste, vous pouvez voir les coordonnées temporelles et fréquentielles de votre annotation.
Ces informations se trouvent également dans le bloc "Selected annotation" (annotation sélectionnée), juste en dessous du
spectrogramme :

![](/annotator/selected-strong.png)

Pour changer le label de votre annotation, vous devez sélectionner l'annotation puis cliquer sur le label approprié dans
le bloc "Labels list".

::: info

Veuillez noter que les boîtes ne peuvent pas être déplacées ou redimensionnées pour le moment.

:::

### Valider une annotation

En mode vérification, le bloc "Annotations" contient toutes les données du détecteur que vous devez confirmer ou
infirmer.

![](/annotator/check-list.png)

Voici un exemple avec une présence.
Vous trouverez les mêmes informations que dans le mode Création d'annotations, plus le nom du détecteur (ici «
mthieu »).

Les boutons à droite vous permettent de choisir si vous trouvez l'annotation correcte ou non.

Comme dans le mode Création d'annotations, chaque boîte est affichée sur le spectrogramme et peut être écoutée.

::: info

Veuillez noter que les annotations ne peuvent pas être modifiées (déplacées, redimensionnées, re-labellisées) pour le
moment.

:::

### Ajouter des commentaires

Vous pouvez ajouter des commentaires sur chaque annotation ou sur la tâche.

![](/annotator/comment-bloc.png)

Pour ajouter un commentaire à une annotation, il faut d'abord la sélectionner (dans le bloc "Annotations" ou sur le
spectrogramme).
Pour ajouter un commentaire à la tâche, cliquez sur le bouton "Task Comment" en bas du bloc "Comments".

![](/annotator/comment-indicators.png)

L'icône de commentaire est modifiée en fonction de l'existence d'un commentaire : la bulle est remplie si un commentaire
existe pour l'annotation ou la tâche. Cette information est affichée pour chaque annotation dans le
bloc "Annotations" ou dans son en-tête sur le spectrogramme, et pour la tâche sur le bouton "Task Comment" en bas du
bloc "Comments".

### Spécifier un niveau de confiance

Si votre campagne vous le permet, vous pouvez spécifier le niveau de confiance que vous accordez à votre annotation en
sélectionnant le niveau approprié dans le bloc "Confidence indicator".

![](/annotator/confidence.png)

### Caractéristiques acoustiques

::: tip Bientôt
:::

## Soumission des annotations et navigation

Les boutons de navigation sont situés sous le spectrogramme.

Pour sauvegarder vos modifications, vous devez cliquer sur le bouton "Submit & load next recording" (Soumettre et
charger l'enregistrement suivant) une fois que vous avez terminé.
Le fichier suivant sera automatiquement chargé.

Les boutons fléchés vous permettent de naviguer entre les fichiers

![](/annotator/submit.png)
::: tip Raccourci :keyboard:
La touche “entrée” de votre clavier est un raccourci pour soumettre votre tâche et passer à la tâche suivante. Les
flèches gauche et droite de votre clavier vous permettent de naviguer entre les tâches
:::

:::danger Attention

La simple navigation ne sauvegarde pas les modifications apportées.

:::