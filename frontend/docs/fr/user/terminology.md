### Dataset

Le dataset est un jeu de donnée, un ensemble de segments audio et de leurs spectrogrammes pré-calculés.

### Spectrogram configuration

Des configurations de spectrogrammes sont enregistrées pour définir de quelle manière le spectrogramme a été généré.
Chaque dataset peut avoir une ou plusieurs configurations spectrogrammes. Ces différentes configurations peuvent être
visualisées pendant l'annotation.

### Annotation campaign

Une campagne d'annotation désigne l'annotation d'un dataset avec un ensemble défini de labels et d'annotateurs. Chaque
campagne est défini par un nom, un dataset et des configurations de spectrogrammes.

### Annotator

L'annotateur désigne l'utilisateur qui va annoter une campagne d'annotation.

### Label

Un label est l'étiquette que l'on va assigner à un son défini. Il peut désigner un son d'intérêt comme une vocalisation
d'une espèce ou un passage de bateau.

### Annotation

L'annotation définie l'association d'un label à un segment audio. L'annotation peut être :

- Une présence : Indique la présence du son d'intérêt sur le segment audio.
- Une boîte : Défini l'emplacement du son d'intérêt dans le segment. La boîte est dessinée par l'utilisateur et encadre
  le son d'intérêt.

Dans APLOSE, l'annotateur peut également laisser un commentaire et/ou exprimer son niveau de confiance sur son
annotation.

### Confidence indicator

L'indicateur de confiance représente le niveau de confiance de l'annotateur dans son annotation. Cet indicateur peut
être personnalisé par le créateur de campagne.

### Task

La tâche désigne un segment à annoter pour un annotateur donné dans une campagne donnée. Le status de la tâche peut
être :

- Unassigned : Le segment n'a pas été assigné à l'annotateur
- Created : Le segment est assigné à l'annotateur, mais l'annotateur ne l'a pas encore soumis
- Finished : Le segment est assigné à l'annotateur et l'annotateur a soumis ses annotations.
