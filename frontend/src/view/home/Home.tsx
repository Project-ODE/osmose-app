import React, { Fragment, useMemo, useState } from "react";
import { Footer, Header } from "@/components/layout";
import styles from './home.module.scss';
import { IonButton, IonIcon } from "@ionic/react";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { createPortal } from "react-dom";
import { DocumentationButton } from "@/components/Buttons/Documentation-button.tsx";
import { Button, Link } from "@/components/ui";
import { useListCollaboratorsQuery } from "@/service/collaborator";
import { useAppSelector } from "@/service/app.ts";
import { selectIsConnected } from "@/service/auth";
import { useHistory } from 'react-router-dom';


export const Home: React.FC = () => {
  const isConnected = useAppSelector(selectIsConnected);
  const history = useHistory();

  function accessAplose() {
    if (isConnected) history.push('/annotation-campaign');
    else history.push('/login')
  }

  return (
    <div className={ styles.page }>
      <Header buttons={ <Fragment>
        <Button color='dark' fill='clear' size='large' onClick={ accessAplose }>
          { isConnected ? 'APLOSE' : 'Login' }
        </Button>
        <Link href='/' size='large'>OSmOSE</Link>
      </Fragment>
      }/>
      <img src="images/home/banner.jpg" loading='lazy'
           alt="Aplose Page Banner"
           className={ styles.banner }/>
      <div className={ styles.content }>

        <Intro/>

        <ManualAnnotation/>

        <PlatformFeatures/>

        <Resources/>

        <Collaboration/>

        <Join/>

        <Collaborators/>

      </div>
      <Footer/>
    </div>
  )
}

const Intro: React.FC = () => (
  <div className={ styles.bloc }>
    <h2>
      Welcome to the overview page for APLOSE:
      Annotation Platform for Ocean Sound Explorers
    </h2>
    <p>
      APLOSE is the OSmOSE team platform for marine acoustic research.
      It is an open-source annotation platform that facilitates collaboration in the field of underwater acoustics.
      Dive into our short video presentation to find out more about APLOSE.
    </p>
    <video controls>
      <source src='video/home/démo_APLOSE.mp4' type="video/mp4"/>
    </video>
  </div>
)

const ManualAnnotation: React.FC = () => (
  <div className={ styles.bloc }>
    <h2>
      Manual annotation of marine sounds
    </h2>
    <p>
      Manual annotation is the action of assigning labels on spectrograms (time/frequency representation of
      the sound) of a dataset. A dataset is made of audio files that will be annotated by one or several
      annotators during an annotation campaign.
      These audio files can be divided into smaller audio segments, depending on the sounds of interest. An
      annotation task is a spectrogram and its matching audio segment associated with a set of labels from
      which the annotator must choose to make the annotations. Labels are tags that designate the sounds to
      search on the spectrogram.
      They can describe broad categories of sound (biophony, geophony, anthropophony), groups of species
      (odontocetes, black fish, etc) or more specific types of sound (air gun, blue whale D-calls, etc).
      Within an annotation campaign, each annotator is given a list of annotation tasks to accomplish. There
      are 2 classes of annotation: weak annotation,
      the annotator annotates the whole spectrogram from the list of available labels ; and strong
      annotation, the annotator draws a labeled time-frequency box around the targeted sound event.
    </p>
    <img src='images/home/GIF.gif' alt="Glider" className="full-width-margin-top"/>

  </div>
)

const PlatformFeatures: React.FC = () => {
  const [ index, setIndex ] = useState<number>(0);
  const [ isCarouselOpenedInModal, setIsCarouselOpenedInModal ] = useState<boolean>(false);

  function toggleCarouselModal() {
    setIsCarouselOpenedInModal(previous => !previous)
  }

  return (
    <div className={ styles.bloc }>
      <h2>
        Platform features
      </h2>
      <p>
        Explore the core functionalities of APLOSE through detailed screenshots that illustrate how our
        platform operates. Among other, APLOSE allows to:
      </p>
      <ul>
        <li>Visualize and zoom on pre-computed spectrogram</li>
        <li>Play the sound at different speeds</li>
        <li>Add custom labels on the whole spectrogram or draw boxes around the sounds</li>
        <li>Specify a confidence indicator on each annotation</li>
        <li>Add comments on each annotation</li>
        <li>Easily download the results in a CSV format</li>
      </ul>

      <Carousel index={ index } onIndexChange={ setIndex }
                isModal={ false }
                onClick={ toggleCarouselModal }/>

      { isCarouselOpenedInModal && createPortal(<Carousel index={ index } onIndexChange={ setIndex }
                                                          isModal={ isCarouselOpenedInModal }
                                                          onClick={ toggleCarouselModal }/>, document.body) }
    </div>
  )
}

const Carousel: React.FC<{
  index: number;
  onIndexChange(index: number): void;
  isModal: boolean;
  onClick(): void;
}> = ({ index, onIndexChange, isModal, onClick }) => {
  const trainingImages = Array.from(new Array(7)).map((_, i) => i);
  const realIndex = useMemo(() => index % trainingImages.length, [ index, trainingImages ])

  return <div className={ [ styles.carouselContainer, isModal ? styles.modal : '' ].join(' ') }
              onClick={ onClick }>
    <div className={ styles.carousel } onClick={ e => e.stopPropagation() }>
      <IonButton className={ styles.previousBtn } shape='round'
                 onClick={ () => onIndexChange(index - 1) }>
        <IonIcon icon={ chevronBackOutline } slot='icon-only'/>
      </IonButton>
      { trainingImages.map((id) => (
        <img key={ id }
             src={ `images/home/etape${ id + 1 }.png` }
             onClick={ !isModal ? onClick : () => {
             } }
             alt={ `Training Resource ${ id + 1 }` }
             style={ { transform: `translateX(-${ realIndex * 100 }%)` } }/>
      )) }
      <IonButton className={ styles.nextBtn } shape='round'
                 onClick={ () => onIndexChange(index + 1) }>
        <IonIcon icon={ chevronForwardOutline } slot='icon-only'/>
      </IonButton>
    </div>
  </div>
}

const Resources: React.FC = () => (
  <div className={ styles.bloc }>
    <h2>Resources and training</h2>
    <p>
      To ensure all new users can effectively exploit APLOSE, we offer a range of tutorials and training
      documents. These resources are designed to help you quickly become proficient in navigating the
      interface and using the available tools.
    </p>
    <div className={ styles.links }>
      <DocumentationButton/>
      /
      <Link href="/app/images/campagne.pdf" target="_blank"
            rel="noopener noreferrer" color='medium'>
        Annotation Campaign APOCADO
      </Link>
    </div>
  </div>
)

const Collaboration: React.FC = () => (
  <div className={ styles.bloc }>
    <h2>Collaboration and open source</h2>
    <p>
      APLOSE platform was used in several research projects involving citizen science with the Astrolabe
      Expeditions organization <a href="https://www.astrolabe-expeditions.org/"
                                  target="_blank">Astrolabe</a>, the Sorbonne university and the Institut
      d’Alembert. It also helps with delphinidae monitoring along the French Mediterranean coast by the
      association <a href="https://miraceti.org/" target="_blank">MIRACETI</a>. The annotations made through
      APLOSE also enabled to evaluate automated detection algorithm performance and to create a geophony
      reference dataset.
      APLOSE relies on its open-source community, welcoming contributions from everywhere to enhance and
      develop the platform further. For example, the platform was deployed on the <a
      href="https://www.france-energies-marines.org/" target="_blank">France Energies Marines</a> server to be
      managed and used by their team. They will also take part in the development of the future
      technological improvements of APLOSE, in collaboration with the OSmOSE team.
      All the codes and associate documentations to collaborate can be found on our Github page.
    </p>
  </div>
)

const Join: React.FC = () => (
  <div className={ styles.bloc }>
    <h2>Join the APLOSE community</h2>
    <p>
      By analyzing these acoustic data, help us providing a better insight into marine life behaviours,
      habitat conditions, and environmental changes. We invite you to join the APLOSE platform, whether you
      are a developer, researcher, or simply passionate about marine conservation. You can get involved with
      us in various ways: annotate data, conduct research, or develop new technological features.
      If you want to join us, or have any question, please contact us here!
    </p>
  </div>
)

const Collaborators: React.FC = () => {

  const { data: collaborators } = useListCollaboratorsQuery()
  return (
    <div className={ styles.bloc }>
      <h2>Collaborators & Funders</h2>

      <div className={ [ styles.links, styles.collaborators ].join(' ') }>
        { collaborators?.map(collaborator => {
          const img = (<img key={ collaborator.id }
                            src={ collaborator.thumbnail }
                            alt={ collaborator.name }
                            title={ collaborator.name }/>)
          if (!collaborator.url) return img;
          return (<a href={ collaborator.url }
                     key={ collaborator.id }
                     target="_blank" rel="noreferrer">{ img }</a>)
        }) }
      </div>
    </div>
  )
}