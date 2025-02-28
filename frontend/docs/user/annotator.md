# Annotation

To annotate a file you must access a campaign and then click on a file access link.

## The annotator page

![](/annotator/create-1.png)
![](/annotator/create-2.png)

The annotator is the main page of APLOSE. It allows to annotate audio recordings thanks to their spectrogram.


### Spectrogram visualisation
The spectrogram is labelled with time and frequency axes.
A selector above the spectrogram let you should between available FFT parameters for your spectrogram. You can also have different frequency scales.

![](/annotator/spectro-config.png)

::: details Frequency scales

| Scale      | Description                                                                                                                     |
|------------|---------------------------------------------------------------------------------------------------------------------------------|
| linear     | Linear scale from 0 to sample rate / 2                                                                                          |
| audible    | Linear scale from 0 to 22kHz                                                                                                    |
| porp_delph | Multi-linear scale:<ul><li>0-50%: 0 to 30kHz</li><li>50-70%: 30kHz to 80kHz</li><li>70-100%: 80kHz to sample rate / 2</li></ul> |
| dual_lf_hf | Multi-linear scale:<ul><li>0-50%: 0 to 22kHz</li><li>50-100%: 22kHz to sample rate / 2</li></ul>                                |
:::

### Zoom in spectrogram
A zoom feature is available on time only.
You can zoom with the zoom buttons next to the spectrogram configuration selector or with the mouse wheel on the spectrogram.

![](/annotator/zoom.png)

The zoom is discrete: each zoom level offers pre-computed spectrogram, meaning zoom levels are decided by the creator of the dataset.

### Listen to the audio file

You can listen to the recording thanks to the play/pause button bellow the spectrogram (on the left).
You can set the time position from which you want to start listen by clicking on the spectrogram.

![](/annotator/audio.png)

Next to the play/pause button, you can choose the speed of the playback (from 0.25x to 4x).
This allows you to hear high frequencies by slowing down the playback, or low frequencies by speeding up the playback.

::: warning
Files with a really high sampling rate may not be compatible with your browser.
The compatibility limit depends on the browser.
Firefox tends to have the wider compatibility.
:::
::: tip Tips :bulb:
Use a headset for a better listening experience!
:::

## Annotate
We differentiate several types of annotations:
- weak annotation: a label is present on the file
- strong annotation: a label is present at this exact position/area


Strong annotation are made using boxes. For each strong annotation, there is a weak annotation associated to the same label.

::: details Coming soon 
We are thinking of adding point annotation soon.
:::

In the cas you loaded an already submitted file, your previous submission should appear and can be modified. 

### Add a weak annotation

You can add a weak annotation my checking the desired labels in the "Presence / Absence" bloc.

![](/annotator/weak.png)

You can see all your annotations on the "Annotations" bloc. In this example we have the two selected labels.

![](/annotator/weak-list.png)

::: info Note
If you uncheck a weak annotation, it will remove all annotations, weak or strong, made using this label.
:::

### Add a box annotation

Each weak annotation made will enable the linked labels for a strong annotation in the "Labels list" bloc. 
In this bloc, you can select the label you want to use to create your annotation.

![](/annotator/strong.png)

To create a box annotation, click on the spectrogram and drag over the area containing the sound of interest.
On click release, the annotation is created and selected.

![](/annotator/box.png)
<small>_This is an example_</small>

On the header of the annotation, you can see:
- A play button to listen to your annotation
- The associated label
- A comment indicator (see the comment section bellow)
- A button to remove your annotation

The strong annotations are listed in the "Annotations" bloc.
Each strong annotation is bellow the corresponding weak annotation.

![](/annotator/strong-list.png)

In the list, you can see the time and frequency coordinates of your annotation.
The information can also be found in the "Selected annotation" bloc right bellow the spectrogram:

![](/annotator/selected-strong.png)

To change the label of your annotation, you must select the annotation and then click on the right label in the "Labels list" bloc.

::: info 
Please note the boxes cannot be moved or resized for now.
:::

### Check an annotation

In check mode, the "Annotations" bloc contains all the detector output you need to confirm or infirm.

![](/annotator/check-list.png)

Here is an example with a weak label.
You can find the same information as in the Create annotations mode plus the name of the detector (here "mthieu).

The buttons on the right let you choose either you find the annotation correct or not.

Like in the Create annotations mode, each strong annotation is displayed on the spectrogram and can be listened.

::: info
Please note the annotations cannot be edited (moved, resized, relabelled) for now.
:::

### Add comments

You can add comments on each annotation or on the task.

![](/annotator/comment-bloc.png)

To add a comment to an annotation, first select it (in the "Annotations" bloc or on the spectrogram).
To add a comment to the task clik on the "Task Comment" button at the bottom of the "Comments" bloc.

![](/annotator/comment-indicators.png)

The comment icon changed based one the existence of a comment: the buble is filled if a comment exists for the annotation or task.
This information is displayed for each annotation in the "Annotations" bloc or in its header on the spectrogram, and for the task on the "Task Comment" button at the bottom of the "Comments" bloc.


### Specify confidence

If your campaign allows you to, you can specify the confidence level you have on your annotation by selecting the appropriate one in the "Confidence indicator" bloc.

![](/annotator/confidence.png)

### Acoustic features

::: tip Coming soon 
:::


## Submit and navigate

The navigation buttons are located below the spectrogram.
![](/annotator/submit.png)

To save your changes, you must click on the "Submit & load next recording" button once you're done. 
This will automatically load the next file.

The arrow buttons allows you to navigate between the files
:::danger Be careful
The navigation does not save the changes you've made.
:::