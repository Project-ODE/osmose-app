"""Label related models"""
from django.db import models


class Label(models.Model):
    """
    This table contains labels which are used to constitute label_set and serve to annotate files for annotation
    campaigns.
    """

    def __str__(self):
        return str(self.name)

    name = models.CharField(max_length=255, unique=True)


class LabelSet(models.Model):
    """
    This table contains collections of labels to be used for dataset annotations.
    An label_set is created by a staff user
    and can be used for multiple datasets and annotation campaigns.
    """

    def __str__(self):
        return str(self.name)

    name = models.CharField(max_length=255, unique=True)
    desc = models.TextField(null=True, blank=True)
    labels = models.ManyToManyField(Label)
