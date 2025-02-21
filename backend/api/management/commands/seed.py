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
    AnnotationFileRange,
    ConfidenceIndicatorSetIndicator,
)
from backend.aplose.models import AploseUser
from backend.aplose.models.user import ExpertiseLevel
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
            type=int,
            default=5,
            help="Give the amount of dataset/campaigns to create, useful to test request optimisations",
        )
        parser.add_argument(
            "--files-nb",
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
        self.admin = AploseUser.objects.create(
            user=User.objects.create_user(
                "admin", "admin@osmose.xyz", password, is_superuser=True, is_staff=True
            ),
            expertise_level=ExpertiseLevel.EXPERT,
        ).user
        # WARNING : names like TestUserX are used for Cypress tests, do not change or remove
        users = [
            AploseUser(
                user=User.objects.create(
                    username="TestUser1",
                    email="TestUser1@osmose.xyz",
                    password=make_password(password),
                    first_name="User1",
                    last_name="Test",
                ),
                expertise_level=ExpertiseLevel.EXPERT,
            ),
            AploseUser(
                user=User.objects.create(
                    username="TestUser2",
                    email="TestUser2@osmose.xyz",
                    password=make_password(password),
                    first_name="User2",
                    last_name="Test",
                ),
                expertise_level=ExpertiseLevel.NOVICE,
            ),
            AploseUser(
                user=User.objects.create(
                    username="TestUser3",
                    email="TestUser3@osmose.xyz",
                    password=make_password(password),
                    first_name="User3",
                    last_name="Test",
                    is_superuser=True,
                    is_staff=True,
                ),
                expertise_level=ExpertiseLevel.NOVICE,
            ),
        ]
        names = [self.fake.unique.first_name() for _ in range(40)]
        for name in names:
            users.append(
                AploseUser(
                    user=User.objects.create(
                        username=name,
                        email=f"{name}@osmose.xyz",
                        password=make_password(password),
                        first_name=name,
                        last_name=self.fake.last_name(),
                    ),
                    expertise_level=ExpertiseLevel.NOVICE,
                ),
            )
        AploseUser.objects.bulk_create(users)
        self.users = list(User.objects.all())

    def _create_metadata(self):
        print(" ###### _create_metadata ######")
        self.dataset_type = DatasetType.objects.create(name="Coastal audio recordings")
        self.audio_metadatum = AudioMetadatum.objects.create(
            channel_count=1,
            dataset_sr=327680,
            total_samples=88473600,
            gain_db=22,
            gain_rel=-165,
            dutycycle_rdm=45,
            dutycycle_rim=60,
        )
        self.audio_metadatum.files_subtypes.create(name="PCM-16")
        self.geo_metadatum = GeoMetadatum.objects.create(
            name="Saint-Pierre-et-Miquelon", desc="South of Saint-Pierre-et-Miquelon"
        )
        self.window_type = WindowType.objects.create(name="Hamming")

    def _create_datasets(self):
        print(" ###### _create_datasets ######")
        files = []
        configs = []
        dataset_names = [
            "Test Dataset",
            "Test archived",
        ]  # WARNING : This name is used for Cypress tests, do not change or remove
        dataset_names += [
            self.fake.unique.city() for _ in range(max(0, self.data_nb - 5))
        ]
        dataset_names.append("porp_delph")
        dataset_names.append("dual_lf_hf")
        dataset_names.append("audible")
        datasets_colormap = {
            "Test Dataset": "Greys", # +3 viridis added manually below
            "Test archived": "Greys",
            "porp_delph": "viridis",
            "dual_lf_hf": "Greys",
            "audible": "yiorrd"
        }
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
                files.append(
                    DatasetFile(
                        filename="50h_0.wav",
                        filepath="data/audio/50h_0.wav",
                        size=58982478,
                        start=(start + timedelta(hours=k)),
                        end=(end + timedelta(hours=k)),
                        dataset=dataset,
                    )
                )
            linear_scale, multi_linear_scale = get_frequency_scales(
                name=name, sample_rate=self.audio_metadatum.dataset_sr
            )
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
                    colormap=datasets_colormap[name],
                    dynamic_min=0,
                    dynamic_max=0,
                    window_type=self.window_type,
                    frequency_resolution=0,
                    dataset=dataset,
                    linear_frequency_scale=linear_scale,
                    multi_linear_frequency_scale=multi_linear_scale,
                )
            )
            if name == "Test Dataset":
                linear_scale, multi_linear_scale = get_frequency_scales(
                    name="porp_delph", sample_rate=self.audio_metadatum.dataset_sr
                )
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
                        colormap="viridis",
                        dynamic_min=0,
                        dynamic_max=0,
                        window_type=self.window_type,
                        frequency_resolution=0,
                        dataset=dataset,
                        linear_frequency_scale=linear_scale,
                        multi_linear_frequency_scale=multi_linear_scale,
                    )
                )
                linear_scale, multi_linear_scale = get_frequency_scales(
                    name="dual_lf_hf", sample_rate=self.audio_metadatum.dataset_sr
                )
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
                        colormap="viridis",
                        dynamic_min=0,
                        dynamic_max=0,
                        window_type=self.window_type,
                        frequency_resolution=0,
                        dataset=dataset,
                        linear_frequency_scale=linear_scale,
                        multi_linear_frequency_scale=multi_linear_scale,
                    )
                )
                linear_scale, multi_linear_scale = get_frequency_scales(
                    name="audible", sample_rate=self.audio_metadatum.dataset_sr
                )
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
                        colormap="viridis",
                        dynamic_min=0,
                        dynamic_max=0,
                        window_type=self.window_type,
                        frequency_resolution=0,
                        dataset=dataset,
                        linear_frequency_scale=linear_scale,
                        multi_linear_frequency_scale=multi_linear_scale,
                    )
                )

        Dataset.objects.bulk_create(self.datasets)
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
        )
        ConfidenceIndicatorSetIndicator.objects.create(
            confidence_indicator=confidence_0,
            confidence_indicator_set=self.confidence_indicator_set,
        )
        confidence_1 = ConfidenceIndicator.objects.create(
            label="confident",
            level=1,
        )
        ConfidenceIndicatorSetIndicator.objects.create(
            confidence_indicator=confidence_1,
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
            for config in dataset.spectro_configs.all():
                campaign.spectro_configs.add(config)
            file_ranges = []
            for user in self.users:
                if user.username in ["TestUser2", "TestUser3"]:
                    continue
                last_index = dataset.files.count() - 1
                file_ranges.append(
                    AnnotationFileRange(
                        annotation_campaign_id=campaign.id,
                        annotator_id=user.id,
                        first_file_index=0,
                        first_file_id=dataset.files.all()[0].id,
                        last_file_index=last_index,
                        last_file_id=dataset.files.all()[last_index - 1].id,
                        files_count=dataset.files.count(),
                    )
                )
            AnnotationFileRange.objects.bulk_create(file_ranges)

    def _create_annotation_results(self):
        print(" ###### _create_annotation_results ######")
        campaign = self.campaigns[0]
        labels = self.label_sets[0].labels.values_list("id", flat=True)
        file_range: AnnotationFileRange
        for file_range in campaign.annotation_file_ranges.all():
            done_files = file_range.get_files()[: randint(5, max(self.files_nb - 5, 5))]
            for file in done_files:
                task = AnnotationTask.objects.create(
                    dataset_file=file,
                    annotator=file_range.annotator,
                    status=AnnotationTask.Status.FINISHED,
                    annotation_campaign=campaign,
                )
                if randint(1, 3) >= 2:
                    AnnotationComment.objects.create(
                        comment="a comment",
                        annotation_campaign_id=campaign.id,
                        dataset_file_id=task.dataset_file_id,
                        author_id=task.annotator_id,
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

    def _create_comments(self):
        print(" ###### _create_comments ######")
        results = AnnotationResult.objects.all()

        comments = []
        for result in results:
            if randint(1, 3) >= 2:
                comments.append(
                    AnnotationComment(
                        comment=f"a comment : {result.label.name}",
                        annotation_campaign_id=result.annotation_campaign_id,
                        dataset_file_id=result.dataset_file_id,
                        author_id=result.annotator_id,
                        annotation_result=result,
                    )
                )
        AnnotationComment.objects.bulk_create(comments)
