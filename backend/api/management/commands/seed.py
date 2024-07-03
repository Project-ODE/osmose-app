from datetime import datetime, timedelta
from random import randint, choice

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core import management
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from faker import Faker

from backend.api.actions.frequency_scales import get_frequency_scales
from backend.api.models import (
    DatasetType,
    GeoMetadatum,
    AudioMetadatum,
    Dataset,
    LabelSet,
    AnnotationCampaign,
    AnnotationCampaignArchive,
    WindowType,
    ConfidenceIndicator,
    ConfidenceIndicatorSet,
    AnnotationComment,
    AnnotationResult,
    DatasetFile,
    AnnotationTask,
    SpectrogramConfiguration,
)
from backend.osmosewebsite.management.commands.seed import Command as WebsiteCommand


class Command(management.BaseCommand):
    help = "Seeds the DB with fake data (deletes all existing data first)"
    fake = Faker()

    data_nb = 5
    files_nb = 100
    users = []
    datasets = []

    def add_arguments(self, parser):
        parser.add_argument(
            "--data-nb",
            # action="store_true",
            type=int,
            default=5,
            help="Give the amount of dataset/campaigns to create, useful to test request optimisations",
        )
        parser.add_argument(
            "--files-nb",
            # action="store_true",
            type=int,
            default=100,
            help="Give the amount of files in dataset to create, useful to test request optimisations",
        )

    def handle(self, *args, **options):
        self.data_nb = options["data_nb"] or self.data_nb
        self.files_nb = options["files_nb"] or self.files_nb

        # Cleanup
        print("# Cleanup")
        management.call_command("flush", verbosity=0, interactive=False)

        # Creation
        print("# Creation")
        self._create_users()
        self._create_metadata()
        self._create_datasets()
        self._create_label_sets()
        self._create_confidence_sets()
        self._create_annotation_campaigns()
        self._create_annotation_results()
        self._create_comments()
        WebsiteCommand().handle(*args, **options)

    def _create_users(self):
        print(" ###### _create_users ######")
        password = "osmose29"
        self.admin = User.objects.create_user(
            "admin", "admin@osmose.xyz", password, is_superuser=True, is_staff=True
        )
        # WARNING : names like TestUserX are used for Cypress tests, do not change or remove
        users = [
            User(
                username="TestUser1",
                email="TestUser1@osmose.xyz",
                password=make_password(password),
                first_name="User1",
                last_name="Test",
            ),
            User(
                username="TestUser2",
                email="TestUser2@osmose.xyz",
                password=make_password(password),
                first_name="User2",
                last_name="Test",
            ),
        ]
        names = [self.fake.unique.first_name() for _ in range(40)]
        for name in names:
            users.append(
                User(
                    username=name,
                    email=f"{name}@osmose.xyz",
                    password=make_password(password),
                    first_name=name,
                    last_name=self.fake.last_name(),
                )
            )
        User.objects.bulk_create(users)
        self.users = list(User.objects.all())

    def _create_metadata(self):
        print(" ###### _create_metadata ######")
        self.dataset_type = DatasetType.objects.create(name="Coastal audio recordings")
        self.audio_metadatum = AudioMetadatum.objects.create(
            channel_count=1,
            dataset_sr=32768,
            total_samples=88473600,
            sample_bits=16,
            gain_db=22,
            gain_rel=-165,
            dutycycle_rdm=45,
            dutycycle_rim=60,
        )
        self.geo_metadatum = GeoMetadatum.objects.create(
            name="Saint-Pierre-et-Miquelon", desc="South of Saint-Pierre-et-Miquelon"
        )
        self.window_type = WindowType.objects.create(name="Hamming")

    def _create_datasets(self):
        print(" ###### _create_datasets ######")
        audio_metadata = []
        files = []
        configs = []
        dataset_names = [
            "Test Dataset",
            "Test archived",
        ]  # WARNING : This name is used for Cypress tests, do not change or remove
        dataset_names += [self.fake.unique.city() for _ in range(max(0, self.data_nb - 5))]
        dataset_names.append("porp_delph")
        dataset_names.append("Dual_LF_HF")
        dataset_names.append("Audible")
        for name in dataset_names:
            dataset = Dataset(
                name=name,
                start_date=timezone.make_aware(
                    datetime.strptime("2010-08-19", "%Y-%m-%d")
                ),
                end_date=timezone.make_aware(
                    datetime.strptime("2010-11-02", "%Y-%m-%d")
                ),
                files_type=".wav",
                status=1,
                dataset_type=self.dataset_type,
                audio_metadatum=self.audio_metadatum,
                geo_metadatum=self.geo_metadatum,
                owner=self.admin,
                dataset_path="seed/dataset_path",
            )
            self.datasets.append(dataset)

            for k in range(1, self.files_nb):
                start = parse_datetime("2012-10-03T12:00:00+0200")
                end = start + timedelta(minutes=15)
                audio_metadatum = AudioMetadatum(
                    start=(start + timedelta(hours=k)), end=(end + timedelta(hours=k))
                )
                audio_metadata.append(audio_metadatum)
                files.append(
                    DatasetFile(
                        filename=f"sound{k:03d}.wav",
                        filepath="data/audio/50h_0.wav",
                        size=58982478,
                        audio_metadatum=audio_metadatum,
                        dataset=dataset,
                    )
                )
            linear_scale, multi_linear_scale = get_frequency_scales(name=name, sample_rate=self.audio_metadatum.dataset_sr)
            configs.append(
                SpectrogramConfiguration(
                    name="4096_4096_90",
                    nfft=4096,
                    window_size=4096,
                    overlap=90,
                    zoom_level=3,
                    spectro_normalization="density",
                    data_normalization="0",
                    zscore_duration="0",
                    hp_filter_min_freq=0,
                    colormap="Blues",
                    dynamic_min=0,
                    dynamic_max=0,
                    window_type=self.window_type,
                    frequency_resolution=0,
                    dataset=dataset,
                    linear_frequency_scale=linear_scale,
                    multi_linear_frequency_scale=multi_linear_scale
                )
            )
        Dataset.objects.bulk_create(self.datasets)
        AudioMetadatum.objects.bulk_create(audio_metadata)
        DatasetFile.objects.bulk_create(files)
        SpectrogramConfiguration.objects.bulk_create(configs)

    def _create_label_sets(self):
        print(" ###### _create_label_set ######")
        sets = [
            {
                "name": "Test SPM campaign",
                "desc": "Label set made for Test SPM campaign",
                "labels": ["Mysticetes", "Odoncetes", "Boat", "Rain", "Other"],
            },
            {
                "name": "Test DCLDE LF campaign",
                "desc": "Test label set DCLDE LF 2015",
                "labels": ["Dcall", "40-Hz"],
            },
            {
                "name": "Big label set",
                "desc": "Test label set with lots of labels",
                "labels": set([self.fake.color_name() for _ in range(0, 20)]),
            },
        ]
        self.label_sets = []
        for seed_set in sets:
            label_set = LabelSet.objects.create(
                name=seed_set["name"], desc=seed_set["desc"]
            )
            for label in seed_set["labels"]:
                label_set.labels.create(name=label)
            self.label_sets.append(label_set)

    def _create_confidence_sets(self):
        self.confidence_indicator_set = ConfidenceIndicatorSet.objects.create(
            name="Confident/NotConfident",
            desc=self.fake.paragraph(nb_sentences=5),
        )

        confidence_0 = ConfidenceIndicator.objects.create(
            label="not confident",
            level=0,
            confidence_indicator_set=self.confidence_indicator_set,
        )
        confidence_1 = ConfidenceIndicator.objects.create(
            label="confident",
            level=1,
            confidence_indicator_set=self.confidence_indicator_set,
            is_default=True,
        )
        self.confidences_indicators = [confidence_0, confidence_1]

    def _create_annotation_campaigns(self):
        print(" ###### _create_annotation_campaigns ######")
        self.campaigns = []
        for dataset in self.datasets:
            campaign = AnnotationCampaign.objects.create(
                name=f"{dataset.name} campaign",
                desc=self.fake.sentence(),
                deadline=timezone.make_aware(
                    datetime.strptime("2010-11-02", "%Y-%m-%d")
                ),
                instructions_url=self.fake.uri(),
                annotation_scope=2,
                label_set=LabelSet.objects.first(),
                confidence_indicator_set=ConfidenceIndicatorSet.objects.first(),
                owner=self.admin,
            )
            self.campaigns.append(campaign)
            if dataset.name == "Test archived":
                archive = AnnotationCampaignArchive.objects.create(by_user=self.admin)
                campaign.archive = archive
                campaign.save()
            campaign.datasets.add(dataset)
            campaign.spectro_configs.add(dataset.spectro_configs.first())
            tasks = []
            for file in dataset.files.all().order_by("?"):
                for user in self.users:
                    task = AnnotationTask(
                        dataset_file=file,
                        annotator=user,
                        status=0,
                        annotation_campaign=campaign,
                    )
                    tasks.append(task)
            AnnotationTask.objects.bulk_create(tasks)

    def _create_annotation_results(self):
        print(" ###### _create_annotation_results ######")
        campaign = self.campaigns[0]
        labels = self.label_sets[0].labels.values_list("id", flat=True)
        for user in self.users:
            done_files = randint(5, max(self.files_nb - 5, 5))
            tasks = campaign.tasks.filter(annotator_id=user.id)[:done_files]
            for task in tasks:
                if randint(1, 3) >= 2:
                    AnnotationComment.objects.create(
                        comment="a comment",
                        annotation_task=task,
                        annotation_result=None,
                    )
                for _ in range(randint(1, 5)):
                    start_time = randint(0, 600)
                    start_frequency = randint(0, 10000)
                    campaign.results.create(
                        start_time=start_time,
                        end_time=start_time + randint(30, 300),
                        start_frequency=start_frequency,
                        end_frequency=start_frequency + randint(2000, 5000),
                        label_id=choice(labels),
                        confidence_indicator=choice(self.confidences_indicators),
                        dataset_file_id=task.dataset_file_id,
                        annotator_id=task.annotator_id,
                    )
                task.status = 2
                task.save()

    def _create_comments(self):
        print(" ###### _create_comments ######")
        results = AnnotationResult.objects.all()

        comments = []
        for result in results:
            if randint(1, 3) >= 2:
                comments.append(
                    AnnotationComment(
                        comment=f"a comment : {result.label.name}",
                        annotation_task=AnnotationTask.objects.filter(
                            annotation_campaign_id=result.annotation_campaign_id,
                            dataset_file_id=result.dataset_file_id,
                            annotator_id=result.annotator_id,
                        ).first(),
                        annotation_result=result,
                    )
                )
        AnnotationComment.objects.bulk_create(comments)
