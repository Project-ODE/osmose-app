# TODO : Faker is a dev tool that shouldn't be needed in production
# however currently start.sh calls this command indiscriminately so it fails
# in production if faker is imported at the start. Removing the failure on import
# is a quickfix however another solution like changing start.sh might be better.

from random import Random
from faker import Faker

from django.core.management.base import BaseCommand

from backend.osmosewebsite.models import TeamMember, News


class Command(BaseCommand):
    help = "Seeds the DB with fake data (deletes all existing data first)"
    fake = Faker()
    random = Random()

    def handle(self, *args, **options):

        # Creation
        self._create_team_members()
        self._create_news()

    def _create_team_members(self):
        print(" ###### _create_team_members ######")
        for _ in range(0, self.random.randrange(start=1, stop=25)):
            profile = self.fake.profile()
            websites = profile["website"]
            TeamMember.objects.create(
                firstname=self.fake.first_name(),
                lastname=self.fake.last_name(),
                position=profile["job"],
                biography="\n".join(self.fake.paragraphs(5)),
                picture=f"https://api.dicebear.com/7.x/identicon/svg?seed={profile['name']}",
                mail_address=profile["mail"],
                research_gate_url=websites[0] if len(websites) > 0 else None,
                personal_website_url=websites[1] if len(websites) > 1 else None,
                github_url=websites[2] if len(websites) > 2 else None,
                linkedin_url=websites[3] if len(websites) > 3 else None,
            )
        for _ in range(0, self.random.randrange(start=1, stop=15)):
            profile = self.fake.profile()
            websites = profile["website"]
            TeamMember.objects.create(
                firstname=self.fake.first_name(),
                lastname=self.fake.last_name(),
                position=profile["job"],
                biography="\n".join(self.fake.paragraphs(5)),
                picture=f"https://api.dicebear.com/7.x/identicon/svg?seed={profile['name']}",
                mail_address=profile["mail"],
                research_gate_url=websites[0] if len(websites) > 0 else None,
                personal_website_url=websites[1] if len(websites) > 1 else None,
                github_url=websites[2] if len(websites) > 2 else None,
                linkedin_url=websites[3] if len(websites) > 3 else None,
                is_former_member=True,
            )

    def _generate_news_body(self):
        body = ""
        for _ in range(self.random.randint(1, 5)):
            body += f"<blockquote><p>{self.fake.sentence(nb_words=10)}</p></blockquote>"
            paragraphs = [
                f"<p>{para}</p>"
                for para in self.fake.paragraphs(nb=self.random.randint(1, 5))
            ]
            for _ in range(0, self.random.randint(0, 2)):
                paragraphs.append(
                    f"<img src='https://api.dicebear.com/7.x/identicon/svg?seed={self.fake.word()}' width='{100 + 50 * self.random.randint(0, 3)}px'>"
                )
            self.random.shuffle(paragraphs)
            body += "".join(paragraphs)
        return body

    def _create_news(self):
        print(" ###### _create_news ######")
        for _ in range(self.random.randint(5, 15)):
            news = News.objects.create(
                title=self.fake.sentence(nb_words=10)[:255],
                intro=self.fake.paragraph(nb_sentences=5)[:255],
                body=self._generate_news_body(),
                date=self.fake.date_time_between(start_date="-1y", end_date="now"),
                vignette=f"https://api.dicebear.com/7.x/identicon/svg?seed={self.fake.word()}",
            )
            for i in range(1, self.random.randint(2, 5)):
                news.osmose_member_authors.add(TeamMember.objects.filter(id=i).first())
                news.save()
            other_authors = []
            for i in range(self.random.randint(2, 5)):
                other_authors.append(self.fake.name())
            news.other_authors = '{' + ','.join(other_authors) + '}'
            news.save()
