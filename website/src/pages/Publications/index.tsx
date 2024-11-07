import { PageTitle } from "../../components/PageTitle";

import imgTitle from '../../img/illust/pexels-element-digital-1370295_thin.webp';

export const Publications: React.FC = () => {

  return (
    <div id="publications-page">
      <PageTitle img={ imgTitle } imgAlt="Publications Banner">
        SCIENTIFIC PUBLICATIONS
      </PageTitle>

      <div className="container">
        <section className="my-5">
          <h2>Peer reviewed articles</h2>

          <ul>
            <li>
              <a href="https://doi.org/10.1016/j.ecoinf.2024.102642" target="_blank" rel="noreferrer"><strong>Dubus, G.,
                Cazau, D., Torterotot, M., Gros-Martial, A., Duc, P. N. H.</strong>, & Adam, O. (2024). From citizen
                science to AI models: Advancing cetacean vocalization automatic detection through multi-annotator
                campaigns. <em>Ecological Informatics</em>, 102642</a>
            </li>
            <li>
              <a href="https://doi.org/10.1016/j.marpol.2023.105983" target="_blank" rel="noreferrer"><strong>Michel,
                M.</strong>, Guichard, B., <strong>Béesau, J., & Samaran, F.</strong> (2024). Passive acoustic
                monitoring for assessing marine mammals population in European waters: Workshop conclusions and
                perspectives. <em>Marine Policy</em>, 160, 105983</a>
            </li>
            <li>
              <a href="https://doi.org/10.1121/10.0025545" target="_blank" rel="noreferrer"><strong>Michel, M.,
                Torterotot, M.</strong>, Royer, J. Y., & <strong>Samaran, F</strong>. (2024). Effects of duty cycle on
                passive acoustic monitoring metrics: The case of blue whale songs. <em>The Journal of the Acoustical
                  Society of America</em>, 155(4), 2538-2548</a>
            </li>
            <li>
              <a href="https://doi.org/10.3390/rs15235604" target="_blank" rel="noreferrer">Martinez, M. M.,
                Ruiz-Etcheverry, L. A., Saraceno, M., <strong>Gros-Martial, A.</strong>, Campagna, J., Picard, B., &
                Guinet, C. (2023). Satellite and High-Spatio-Temporal Resolution Data Collected by Southern Elephant
                Seals Allow an Unprecedented 3D View of the Argentine Continental Shelf. <em>Remote Sensing</em>,
                15(23), 5604.</a>
            </li>
            <li>
              <strong>G. Dubus, M. Torterotot, P. N. H. Duc, J. Beesau, D. Cazau</strong> and O. Adam. Better
              quantifying inter-annotator variability: A step towards citizen science in underwater passive
              acoustics. <em>OCEANS 2023 - Limerick</em>, Limerick, Ireland, pp. 1-8.
            </li>
            <li>
              <a href="https://doi.org/10.1016/j.dsr2.2022.105204" target="_blank" rel="noreferrer"><strong>Torterotot,
                M., Beesau</strong>, J., Perrier de la Bathie, C., & <strong>Samaran, F.</strong> (2022). Assessing
                marine mammal diversity in remote Indian Ocean regions, using an acoustic glider. <em>Deep Sea Research
                  Part II: Topical Studies in Oceanography</em>, 206.</a>
            </li>
          </ul>
        </section>

        <section className="my-5">
          <h2>Conferences</h2>

          <ul>
            <li>
              <a href="https://doi.org/10.13140/RG.2.2.28165.36320" target="_blank" rel="noreferrer">
                <strong>Beesau, J., Torterotot, M., Gicquel, C., & Samaran, F.</strong> (2024). Comparing F-POD
                delphinid
                and porpoise clicks detection with ground truth manual annotation. <em>Detection, Classification,
                Localization and Density Estimation of marine mammals using passive acoustics 2024</em>, Rotterdam, The
                Netherlands.
              </a>
            </li>
            <li>
              <a href="https://doi.org/10.13140/RG.2.2.15215.44969" target="_blank" rel="noreferrer">
                <strong>Samaran, F., Beesau, J., Dupont, M., & Torterotot, M.</strong> (2024). Glider and Whales : using
                acoustic glider to monitor marine mammals. <em>Detection, Classification,
                Localization and Density Estimation of marine mammals using passive acoustics 2024</em>, Rotterdam, The
                Netherlands.
              </a>
            </li>
            <li>
              <a href="https://doi.org/10.13140/RG.2.2.34666.53445" target="_blank" rel="noreferrer">
                <strong>Torterotot, M., Beesau, J., Gicquel, C., & Samaran, F.</strong> (2024). CETIROISE : a cetacean
                passive acoustic observatory in a French Marine Natural Park. <em>Detection, Classification,
                Localization and Density Estimation of marine mammals using passive acoustics 2024</em>, Rotterdam, The
                Netherlands.
              </a>
            </li>
            <li>
              <strong>Dubus, G., Adam, O., Cazau, D.</strong> (2024). Improving automatic detection with supervised
              contrastive learning: application with low-frequency vocalizations. Natural Park. <em>Detection,
              Classification,
              Localization and Density Estimation of marine mammals using passive acoustics 2024</em>, Rotterdam, The
              Netherlands.
            </li>
            <li>
              <strong>Cazau, D., Nguyen Hong Duc, P., Padovese, B., Soares, F., Dubud, G., Farrugia, N., Marmoret, A.,
                Adam, O.</strong> (2024) First attempt at building a mini DCASE-like data challenge for the DCLDE
              workshop. <em>Detection, Classification, Localization and Density Estimation of marine mammals using
              passive acoustics 2024</em>, Rotterdam, The Netherlands.
            </li>
            <li>
              <a href="https://doi.org/10.13140/RG.2.2.28637.22240" target="_blank" rel="noreferrer"><strong>Dupont, M.,
                Béesau, J., Torterotot</strong>, M., Loirat, V.,
                Lagarde, V., <strong>Samaran, F.</strong> (2023) Using passive acoustic to better understand dolphins'
                behaviour around fishing nets in bycatch context. <em>Detection, Classification, Localization and Density Estimation of marine mammals using
                  passive acoustics 2024</em>, Rotterdam, The Netherlands.
              </a>
            </li>
            <li>
              <strong>Samaran, F., Morin, E.</strong> (2024) Etat des lieux des outils de traitement OSEkit et APLOSE
              au sein du projet collaboratif OSmOSE. <em>Workshop SERENADE</em>, Toulon, France
            </li>
            <li>
              <a href="https://doi.org/10.13140/RG.2.2.34666.53445" target="_blank" rel="noreferrer">
                <strong>Maison, T., Torterotot, M., Dupont, M.</strong> (2024) Vers une standardisation nationale des
                métadonnées en acoustique passive sous-marine. <em>Workshop SERENADE</em>, Toulon, France
              </a>
            </li>
            <li>
              <a
                href="https://www.researchgate.net/publication/370637739_Less_is_more_How_the_choice_of_a_recording_duty_cycle_could_affect_monitoring_results_of_passive_acoustic_studies_on_cetaceans"
                target="_blank" rel="noreferrer"><strong>Michel, M., Béesau, J., Torterotot, M., Samaran,
                F.</strong> (2023) Less is more? How the choice of a recording duty cycle could affect monitoring
                results of passive acoustic studies on cetaceans. <em>34th European Cetacean Society annual
                  conference</em>, O’Grove, Spain.</a>
            </li>
            <li>
              <a href="https://www.researchgate.net/publication/374088531_Using_passive_acoustic_to_better_understand_dolphins'_behaviour_around_fishing_nets_in_bycatch_context" target="_blank" rel="noreferrer">
                <strong>Dupont, M., Béesau, J., Torterotot</strong>, M., Loirat, V.,
                Lagarde, V., <strong>Samaran, F.</strong> (2023) Using passive acoustic to better understand dolphins'
                behaviour around fishing nets in bycatch context. <em>34th European Cetacean Society annual
                  conference</em>, O’Grove, Spain.
              </a>
            </li>
            <li>
              <strong>G. Dubus, M. Torterotot, P. N. H. Duc, J. Beesau, D. Cazau</strong> and O. Adam. Better
              quantifying inter-annotator variability: A step towards citizen science in underwater passive
              acoustics. <em>IEEE OCEANS</em> 2023. Limerick, Ireland.
            </li>
            <li>
              <strong>G. Dubus, D. Cazau, M. Torterotot, J. Béesau</strong> and O. Adam. Citizen science involved in
              detection and classification of cetaceans for passive acoustic monitoring. <em>Humpback Whale World
              Congress</em> 2023, Santo Domingo, Dominican Republic.
            </li>
            <li>
              <strong>Michel, M., Torterotot, M., Samaran, F.</strong> Effet du sous-échantillonnage temporel : le cas
              des données acoustiques de grandes baleines dans l’océan Indien. <em>SERENADE</em> 2022, Brest, France.
            </li>
            <li>
              <strong>Cazau, D., .Dubus, G., Torterotot, M., Beesau, J., Samaran, F.</strong> News about OSMOSE: a
              scientific interest group on methods and applications around underwater passive
              acoustics. <em>SERENADE</em> 2022, Brest, France.
            </li>
            <li>
              <strong>Samaran, F., Torterotot, M., Beesau</strong>, J., Gicquel, C. ,CETIROISE – Mise en place d’un
              observatoire acoustique des cétacés au sein du Parc naturel marin d’Iroise
              2021-2023. <em>SERENADE</em> 2022, Brest, France.
            </li>
            <li>
              <strong>Torterotot, M., Beesau, J., Samaran, F.</strong> Calling from nowhere: Assessing marine mammal
              diversity around St Paul and Amsterdam Islands (Indian Ocean) using an acoustic glider. <em>24th biennial
              Conference on the Biology of Marine Mammals</em> 2021, Palm Beach, USA.
            </li>
            <li>
              <strong>Torterotot, M., Samaran, F., Beesau, J., Cazau, D., .Dubus, G., Nguyen Hong Duc,
                P.</strong> APLOSE : a web-based annotation platform to assist collaborative annotation campaigns on
              passive acoustics datasets.
            </li>
          </ul>
          <br/>
        </section>
      </div>
    </div>
  );
};
