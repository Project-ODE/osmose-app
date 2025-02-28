# Create an annotation campaign

To create a campaign click on the "New annotation campaign" button.

![](/campaigns/all-campaigns_campaign-admin.png)

## Global information

You can fill in the global information.

![](/campaign-creator/form-global.png)

- Only the name is required.
- The description can help your annotator to understand the purpose of this campaign for example.
- If you have web page or a PDF stored online you can give its URL on the "Instruction URL" field. It will be accessible
  to the campaign annotators
- The deadline will also be available to the annotators.

## Data

You can then select the dataset to annotate.

![](/campaign-creator/form-data.png)

You will be able to choose one or more spectrogram configuration among the available ones for the selected dataset.

## Annotation

You can select the mode of annotation you need:

- Create annotation: create new annotations on an empty campaign
- Check annotations: validate and invalidate annotations, from a detector output for example

![](/campaign-creator/form-annotation.png)

### Create annotation mode

If you choose the "Create mode" you will need to select a set of labels (read the detailed section below to create a new
label set).
You can also select a confidence indicator set (read the detailed section below to create a new confidence indicator
set).

![](/campaign-creator/form-annotation-create.png)

Once selected, the information about the set are displayed. You can choose to enable "Acoustic features" for some
labels (see [Annotation/Acoustic features](../annotator.md#acoustic-features))

::: details Create a label set
Access APLOSEs administration part with the "Admin" link

Look for “Label sets” in the “API” block and click on “Add”

![](/campaign-creator/label-set/nav.png)

You can fill in the form with the name of your set, the owner (you), and select the labels you need for your annotation
campaigns.
If you do not find the desired labels, you can click on the “+” button close to the labels list to create a new label.

![](/campaign-creator/label-set/form.png)

When your form is filled you can save it.
:::

::: details Create a confidence set
Access APLOSEs administration part with the "Admin" link

Look for “Confidence indicator sets” in the “API” block and click on “Add”

![](/campaign-creator/confidence-set/nav-set.png)

You can fill in the form with the name of your set and save it.

![](/campaign-creator/confidence-set/form-set.png)

You can then look for the “Confidence indicators” in the “API” block and “Add” as many indicators as you need.

![](/campaign-creator/confidence-set/nav-indicator.png)

For each indicator you must fill the label, the level and the associated set that you have just created.
You can define an indicator as the default one for your set by checking the “is default” checkbox.

![](/campaign-creator/confidence-set/form-indicator.png)

:::

### Check annotation mode

With the "Check annotation" mode, you will be asked to import annotations.

![](/campaign-creator/form-annotation-check.png)

It will open a modal to really import you annotations

![](/campaign-creator/form-annotation-check-importcsv.png)

You can either click on the "Import annotation" zone or drag a file in it. The file should be a csv with the following
columns:

| Column                     |          Type          | Description                                                                                                       |
|----------------------------|:----------------------:|-------------------------------------------------------------------------------------------------------------------|
| dataset                    |         string         | Name of the dataset. If it doesn't correspond to the campaign dataset, you will have the choice to keep it or not |
| start_datetime             |       timestamp        | Start of the annotation                                                                                           |
| end_datetime               |       timestamp        | End of the annotation                                                                                             |
| start_frequency            |          int           | Lower frequency of the annotation                                                                                 |
| end_frequency              |          int           | Higher frequency of the annotation                                                                                |
| annotation                 |         string         | Label of the annotation                                                                                           |
| annotator                  |         string         | Detector or annotator that created the annotation                                                                 |
| is_box                     |        boolean         | Either the annotation is a box or a weak annotation                                                               |
| confidence_indicator_label |         string         | The name of the level of confidence (if exists)                                                                   |
| confidence_indicator_level | string<br/>[int]/[int] | The level of confidence on the maximum level available (if exists)                                                |

In the case of weak annotations, start/end datetime and start/end frequency should be the ones of the file.

After submitting your file, you will need to configure the detectors as they will be saved in the database.

![](/campaign-creator/form-annotation-check-detector.png)

You will be asked to assign the CSV detectors to an existing one or to create a new one.
Here you can also select only the detectors you want to check, in case the file contains multiple ones.

You can then specify each detector configuration (existing or new one).

![](/campaign-creator/form-annotation-check-detectorconfig.png)

When you're done you can click on "Import". The selected detectors will be shown on the page.
You can review the selection at anytime here.
If you want to fully change it, you can hit the trash button and import a new file.

![](/campaign-creator/form-annotation-check-imported.png)

## Annotators

In the last part of the form, you will be able to add annotators on your campaign.
For each annotator you can specify the range of file he/she can annotate. You can set two different ranges for the same
annotator.
You can add new annotator with the search input.

![](/campaign-creator/form-annotator.png)

::: info

You will be able to add annotators or files to an annotator at any time.

:::

## Submit

You're all set and can submit your new campaign by clicking on the "Create campaign" button.
After submitting your new campaign, it should appear in the “Annotation campaigns” list.

