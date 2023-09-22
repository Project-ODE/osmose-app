import { PageTitle } from '../../components/PageTitle';
import { Banner } from '../../components/Banner';
import { Card } from '../../components/Card';
import { CardMember } from '../../components/CardMember';
import { CardMemberTextless } from '../../components/CardMemberTextless';

import './styles.css';

import imgPeople from '../../img/illust/pexels-daniel-torobekov-5901263_1280_thin.jpg';
import teamWorking from '../../img/people/TEAM_OSMOSE_666_500.webp';

import enstalogo from '../../img/logo/logo-ensta-bretagne.png';
import ifremerlogo from '../../img/logo/logo_ifremer.png';
import ubologo from '../../img/logo/ubo.png';
import labsticlogo from '../../img/logo/logo-lab-sticc.png';
import iuemLogo from '../../img/logo/iuem.jpeg';
// import imtlogo from '../../img/logo/logo_imt.jpg';

// import projectImg from '../../img/logo_project.png';
import florePortrait from '../../img/people/team_flore_420_420.webp'
import juliePortrait from '../../img/people/team_Photo_Julie_420_420.webp'
import maellePortrait from '../../img/people/maelle_portrait.jpg'
import dorianPortrait from '../../img/people/team_dodo_420_420.webp'
import paulPortrait from '../../img/people/paul_200_200.webp'
import alexPortrait from '../../img/people/alex.jpg'
import mathieuPortrait from '../../img/people/mathieu_portrait.jpg'
import anatolePortrait from '../../img/people/anatole_gros-martial.jpg'
import gabrielPortrait from '../../img/people/gabriel_dubus.webp'
import pierreYvesPortrait from '../../img/people/pierre-yves_le_rolland_raumer.webp'
import quentinPortrait from '../../img/people/quentin_hamard.jpg'
import mathildePortrait from '../../img/people/mathilde_michel.jpg'

export const People: React.FC = () => {

  return (
<div id="people">

  <PageTitle
    img={imgPeople}
    imgAlt="People Banner"
    // imgSet=""
  >
    <h1 className="align-self-center">
      People
    </h1>
  </PageTitle>

  <section className="container my-5">
    <Card
      title="Who are we ?"
      img={teamWorking}
      imgSide="left"
      imgAlt="Brest"
      // url="/people"
      // urlDesc="Lien vers la page"
    >
      <p>
        Launched in Brest (France) in 2018, OSmOSE is a multi-institutional research consortium composed of marine biologists, acousticians, data scientists and computer professionals.
      </p>
        {/* OSmOSE is made of several teams working togeter:

        ODE (Ocean Data Explorer): develop all the computer technology used to manage and process Data (at scale with speed and in context, naturally Big)
        AIe: Develop all the computer technology used to mage computers learn and recognize ocean sounds like humans
        Underwater Passive Acoustics sciences: do all the ocean science based on UPA (mainly about whale monitoring and conservation for the moment) */}
    </Card>
  </section>

  <div className="container mt-5">
    <p className="lead">Partner institutes :</p>
  </div>
  <Banner>
    <img className="" src={enstalogo} alt="Ensta Bretagne logo" title="Ensta Bretagne logo" />
    <img className="" src={ifremerlogo} alt="IFREMER logo" title="IFREMER logo" />
    <img className="" src={labsticlogo} alt="Lab-Stic logo" title="Lab-Stic logo" />
    <img className="" src={ubologo} alt="UBO logo" title="UBO logo" />
    <img className="" src={iuemLogo} alt="IUEM logo" title="IUEM logo" />
    {/* <img className="" src={imtlogo} alt="IMT Atlantique logo" title="IMT Atlantique logo" /> */}
  </Banner>

  <section className="container my-5">
    <h2>Team members</h2>

    <CardMember
      name="Dorian Cazau"
      img={dorianPortrait}
      imgSide="left"
      imgAlt="Dorian’s portrait."
      // job="Data Scientist"
      url="https://cazaudorian.wixsite.com/homepage"
      urlDesc="Personnal page"
    >
      <p className="quote">
        I'm a french Assistant Professor specialized in Data Sciences for Ocean Sciences, currently working in the Lab-STICC at ENSTA Bretagne in Brest (French Brittany). <br/>
        My scientific background is in fundamental physics, audio signal processing and general acoustic engineering, with which I have more recently combined statistical modeling and machine learning methods. My research can be summarized as the development of original physics-based machine learning methods to answer concrete questions from different acoustic-using communities, including oceanography, bioacoustics and music.
      </p>
    </CardMember>

    <CardMember 
      name="Flore Samaran"
      img={florePortrait}
      imgSide="right"
      imgAlt="Flore’s portrait."
      // job="Data Scientist"
      // url="https://www.google.com"
      // urlDesc="Page personnelle"
    >
      <p className="quote">
        I use passive acoustic monitoring to improve knowledge on cetacean populations by deploying acoustic observatories. I have been an assistant professor at ENSTA Bretagne and Lab STICC since 2015. My research questions on cetacean ecology raise specific tools that I submit to the OSmOSE team. I am involve in the first steps of the creation of these tools with the computer scientists and as a user once they are developed. I am also looking for funding to keep this project going!
      </p>
{/*      <p className="quote">
        J’utilise le suivi par acoustique passive pour acquérir de la connaissance sur les populations de cétacés en mettant en place des observatoires acoustiques. Je suis enseignante chercheure à l’ENSTA Bretagne et au Lab STICC depuis 2015. Mes questions de recherche sur l’écologie des cétacés soulèvent des besoins technologiques particuliers que je soumets à l’équipe OSmOSE. Je travaille en amont avec les informaticiens pour définir ces besoins et en tant qu’utilisatrice une fois qu’ils sont développés. Je cherche aussi des financements pour faire vivre ce projet ! 
      </p>*/}
    </CardMember>

    <CardMember
      name="Julie Béesau"
      img={juliePortrait}
      imgSide="left"
      imgAlt="Julie’s portrait."
      // job="Data Scientist"
      // url="https://www.google.com"
      // urlDesc="Page personnelle"
    >
      <p className="quote">
        I am a research engineer at ENSTA Bretagne since 2017 and I work in the bioacoustic team on the monitoring of marine mammal population by passive acoustics. Passive acoustics is, for me, a tool for the study and conservation of marine mammals and more precisely cetaceans along the French coast. Within the OSMOSE team, I work on the scientists' side as a user of the tools developed by the computer scientists, particularly on the APLOSE online annotation platform, as well as analysing the results obtained and their scientific use.
      </p>
      {/* <p className="quote">
        Je suis ingénieur d’étude au sein de l’ENSTA Bretagne depuis 2017 et je travaille dans l’équipe de bioacoustique sur le suivi des populations de mammifères marins par acoustique passive. L’acoustique passive est, pour moi, un outil pour l’étude et la conservation des mammifères marins et plus précisément des cétacés le long des côtes françaises. Au sein de l’équipe OSMOSE, je travaille du côté des scientifiques en tant qu’utilisatrice des outils développés par les informaticiens notamment sur la plateforme d’annotation en ligne APLOSE ainsi qu’à l’analyse des résultats obtenus et à leurs valorisations scientifiques.
      </p> */}
    </CardMember>

    <CardMember
      name="Maëlle Torterotot"
      img={maellePortrait}
      imgSide="right"
      imgAlt="Maëlle’s portrait"
      // job="Data Scientist"
      // url="https://www.google.com"
      // urlDesc="Page personnelle"
    >
      <p className="quote">
        I am a research engineer at ENSTA Bretagne since 2020, where I previously completed my PhD thesis in co-supervision with the Université de Bretagne Occidentale. I work in the bioacoustics team and I am interested in passive acoustic monitoring of marine mammals, from the Indian Ocean to the Brittany's coasts. I use the tools developed by the OSmOSE team, in particular the annotation platform Aplose, but also the notebooks for calculating acoustic descriptors. I am also investing in the development of these tools.
      </p>
      {/* <p className="quote">
        Je suis ingénieur de recherche à l’ENSTA Bretagne depuis 2020, où j’ai précédemment effectué ma thèse de doctorat en co-encadrement avec l’Université de Bretagne Occidentale. Je travaille au sein de l’équipe bioacoustique et m’intéresse aux questions de suivi des mammifères marins par acoustique passive, de l’océan Indien aux côtes bretonnes. Je suis utilisatrice des outils développés par l’équipe OSmOSE, notamment de la plateforme d’annotation Aplose, mais aussi des notebooks de calculs de descripteurs acoustiques. J’essaie en parallèle de m’investir dans le développement de ces outils.
      </p> */}
    </CardMember>
    
    <CardMember 
      name="Anatole Gros-Martial"
      img={anatolePortrait}
      imgSide="left"
      imgAlt="Anatole’s portrait. Anatole is on the right."
      // job="PhD student"
    >
      <p className="quote">
        After a one year internship in machine learning for bioacoustic tasks and a six months internship in acoustic and ethological monitoring of cetacean populations in Martinique, I started my PhD in underwater acoustics in 2022. This CNRS project financed by the CNES uses acoustic data from biologged southern elephant seals. My PhD consists in developping machine learning algorithms to evaluate weather conditions such as rainfall rate and wind speed from the underwater recordings. Data on weather conditions in the Southern Ocean are rare but extremely useful as they directly influence the Antarctic Circumpular Current which regulates oceans worldwide. More biologically centered tasks consist in analyzing southern elephant seals' diving and foraging behavior using additional data from the tags such as temperature, depth and salinity. Furthermore, southern elephant seals can be used as monitoring buoys to detect biological noise from fish and cetaceans.
      </p>
    </CardMember>

    <CardMember
      name="Mathieu Dupont"
      img={mathieuPortrait}
      imgSide="right"
      imgAlt="Mathieu's portrait"
    >
      <p className="quote">
        I joined the bioacoustics team as a research engineer in May 2022. I have a background in general acoustics engineering and signal processing, I did my master at Maine Université in France. I use acoustics to assess marine mammals behaviour. I am particularly focused on the APOCADO project which helps us better understand dolphins bycatches and how to prevent it. I take part in developping tools with the OSmOSE team in order to exploit data as efficiently as possible.
      </p>
    </CardMember>

    <CardMember
      name="Gabriel Dubus"
      img={gabrielPortrait}
      imgSide="left"
      imgAlt="Gabriel Dubus’s portrait"
      // job="Data Scientist"
    >
      <p className="quote">
        I'm a PhD student working jointly in l'Institut Jean le Rond d'Alembert (Sorbonne University/CNRS, Paris, France) and in Lab-STICC (ENSTA Bretagne, Brest France). I have a background in acoustics, signal processing and sound engineering. I'm interested in the use of sound to understand and protect the biodiversity. In my PhD, I'm trying to develop methods for the automatic detection and classification of cetaceans from acoustics recordings. I use tools developed by the OSmOSE team, I contribute to the development of codes and I organise annotation campaigns of underwater acoustics recordings.
      </p>
    </CardMember>

    <CardMember
      name="Pierre-Yves Le Rolland Raumer"
      img={pierreYvesPortrait}
      imgSide="right"
      imgAlt="Pierre-Yves's portrait"
      // job="Data Scientist"
    >
      <p className="quote">
        I'm a PhD student jointly working in Geo-Ocean at IUEM and in Lab-STICC at ENSTA Bretagne, in Brest, France.  Right before, I studied Computer Sciences at Politecnico di Milano. Thus being a computer scientist, my main interests are in particular linked to machine learning applied on marine data. During this PhD, my main goal is to develop deep learning techniques in order to detect and classify some seismological acoustic events, such as T-waves. These studies will mainly focus on data from OHASISBIO (Indian Ocean) and MAHY (Mayotte) networks. Within the OSmOSE team, I should both be an enthusiastic user of the project resources and one of its active developers.
      </p>
    </CardMember>

    <CardMember
      name="Quentin Hamard"
      img={quentinPortrait}
      imgSide="left"
      imgAlt="Quentin's portrait"
      // job="Data Scientist"
    >
      <p className="quote">
        I am a research engineer at France Énergies Marines and I work with the bioacoustics team on the development of deep learning models for the monitoring of marine mammals. My work is part of the OWFSOMM project (Offshore Wind Farm Survey of Marine Megafauna: standardization of tools and methods for monitoring at OWF scales) between several academic research laboratories and industrial partners. Thanks to my knowledge in acoustic engineering, bioacoustics and artificial intelligence, I participate in the use and development of the OSmOSE team's tools.
      </p>
    </CardMember>
    
    <CardMember
      name="Mathilde Michel"
      img={mathildePortrait}
      imgSide="right"
      imgAlt="Mathilde's portrait."
      // job="Data Scientist"
      // url="https://www.google.com"
      // urlDesc="Page personnelle"
    >
      <p className="quote">
        After a master's degree in Oceanography at the University of Aix-Marseille and a first internship on fish acoustics, I decided to complete my studies by integrating the International Master of Bioacoustics from the Jean Monnet University in Saint Etienne. It was during my second internship that I joined ENSTA Bretagne and the OSmOSE team: I worked on the effects of the duty cycle on marine mammal monitoring data by passive acoustics. In October 2022, I started my PhD which aims to optimize these long-term acoustic recordings: from data acquisition to the metrics used to describe them. I use some tools developed by the OSmOSE team and I also contribute to the development.
      </p>
      {/* <p className="quote">
        Je suis ingénieur d’étude au sein de l’ENSTA Bretagne depuis 2017 et je travaille dans l’équipe de bioacoustique sur le suivi des populations de mammifères marins par acoustique passive. L’acoustique passive est, pour moi, un outil pour l’étude et la conservation des mammifères marins et plus précisément des cétacés le long des côtes françaises. Au sein de l’équipe OSMOSE, je travaille du côté des scientifiques en tant qu’utilisatrice des outils développés par les informaticiens notamment sur la plateforme d’annotation en ligne APLOSE ainsi qu’à l’analyse des résultats obtenus et à leurs valorisations scientifiques.
      </p> */}
    </CardMember>
  </section>

  <section className="container my-5">

    <h2>Former members</h2>
    {/* <p>Acknowledgements.</p> */}

    <div className="grid-container">
      {/* <CardMemberTextless 
        img={defautPortrait}
        imgAlt="Joseph’s portrait."
        name="Joseph Allemandou"
        // job="Lead"
        // url="https://www.google.com"
        // urlDesc="Page personnelle"
        >
      </CardMemberTextless> */}

      <CardMemberTextless 
        img={alexPortrait}
        imgAlt="Alexandres portrait"
        name="Alexandre Degurse"
        // job=""
        // url="https://www.google.com"
        // urlDesc="Page personnelle"
        >
      </CardMemberTextless>

      <CardMemberTextless 
        img={paulPortrait}
        imgAlt="Paul’s portrait"
        name="Paul Nguyen Hong Duc"
        // job=""
        // url="https://www.google.com"
        // urlDesc="Page personnelle"
        >
      </CardMemberTextless>

    </div>
    {/* large image of team together */}
  </section>

</div>
);
}
