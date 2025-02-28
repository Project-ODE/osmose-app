# View the campaign results

To view the results, you must access a campaign.

![](/campaigns/campaign-detail.png)

All the detail of the campaign can be found here.
For more information about it, read the [Annotation Campaign detail](../campaign.md#campaign-detail) section.

You can access the "Detailed progression" of all annotators.

![](/campaign-creator/annotator-progression.png)

From here, you can then download the results and status CSV files.

### Results

A table containing all annotations and comments left by the campaign annotators.

| Column                     |          Type          | Description                                                        |
|----------------------------|:----------------------:|--------------------------------------------------------------------|
| dataset                    |         string         | Name of the dataset.                                               |
| filename                   |         string         | Name of the file.                                                  |
| start_time                 |         float          | Relative start of the annotation                                   |
| end_time                   |         float          | Relative end of the annotation                                     |
| start_frequency            |          int           | Lower frequency of the annotation                                  |
| end_frequency              |          int           | Higher frequency of the annotation                                 |
| annotation                 |         string         | Label of the annotation                                            |
| annotator                  |         string         | Author of the annotation or comment                                |
| start_datetime             |       timestamp        | Absolute start of the annotation                                   |
| end_datetime               |       timestamp        | Absolute end of the annotation                                     |
| is_box                     |        boolean         | Either the annotation is a box or a weak annotation                |
| confidence_indicator_label |         string         | The name of the level of confidence (if exists)                    |
| confidence_indicator_level | string<br/>[int]/[int] | The level of confidence on the maximum level available (if exists) |
| comments                   |         string         | Comment left by the annotator.                                     |

### Status

A table indicating the submission status for all files and by all annotators.

| Column       |                  Type                  | Description                                                      |
|--------------|:--------------------------------------:|------------------------------------------------------------------|
| dataset      |                 string                 | Name of the dataset.                                             |
| filename     |                 string                 | Name of the file.                                                |
| [Annotators] | UNASSIGNED <br/>CREATED <br/> FINISHED | State of submission of the annotator (column) on the file (line) |
