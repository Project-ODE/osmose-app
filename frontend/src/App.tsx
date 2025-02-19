import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { AudioAnnotator } from "@/view/audio-annotator/audio-annotator.page.tsx";

import './css/fontawesome/css/fontawesome-5.15.4.min.css';
import './css/fontawesome/css/solid.min.css'
import './css/fontawesome/css/regular.min.css'
import './css/bootstrap-4.1.3.min.css';
import '@ionic/react/css/core.css';
import './css/ionic-override.css';
import './css/annotation-colors.css';
import './css/app.css';

import { IonApp, setupIonicReact } from '@ionic/react';

import { Provider } from "react-redux";
import { AppStore } from "@/service/app";
import { AnnotationCampaignList } from "@/view/campaign/list/annotation-campaign-list.page.tsx";
import { CreateCampaign } from "@/view/campaign/create-edit/create-campaign.page.tsx";
import { EditCampaign } from "@/view/campaign/create-edit/edit-campaign.page.tsx";
import { AuthenticatedRoute } from '@/routes';
import { DatasetList } from '@/view/dataset';
import { CampaignDetail } from '@/view/campaign/detail/DetailPage.tsx';
import { AploseSkeleton } from "@/components/layout";
import { Home } from "@/view/home/Home.tsx";
import { Account, Login } from '@/view/auth';
import { AnnotatorPage } from "@/view/annotator/AnnotatorPage.tsx";
import { useLoadEventService } from "@/service/events";


setupIonicReact({
  mode: 'md',
  spinner: 'crescent',
});

export const App: React.FC = () => (
  <Provider store={ AppStore }><AppContent/></Provider>
)

const AppContent: React.FC = () => {
  useLoadEventService();

  return (
    <IonApp>
      <Router basename='/app'>
        <Switch>
          <Route exact path='/'><Home/></Route>
          <Route exact path="/login"><Login/></Route>

          <AuthenticatedRoute exact
                              path='/annotation-campaign/:campaignID/file/:fileID'><AudioAnnotator/></AuthenticatedRoute>
          <AuthenticatedRoute exact
                              path='/annotation-campaign/:campaignID/file/:fileID/new'><AnnotatorPage/></AuthenticatedRoute>

          <AploseSkeleton>
            <Switch>
              <AuthenticatedRoute exact path='/account'><Account/></AuthenticatedRoute>
              <AuthenticatedRoute exact path='/datasets'><DatasetList/></AuthenticatedRoute>
              <AuthenticatedRoute exact path='/annotation-campaign'><AnnotationCampaignList/></AuthenticatedRoute>
              <AuthenticatedRoute exact path='/annotation-campaign/create'><CreateCampaign/></AuthenticatedRoute>
              <AuthenticatedRoute exact path='/annotation-campaign/:id/edit'><EditCampaign/></AuthenticatedRoute>
              <AuthenticatedRoute exact
                                  path='/annotation-campaign/:id'><CampaignDetail/></AuthenticatedRoute>
              <Route path="**"><Redirect to="/annotation-campaign"/></Route>
            </Switch>
          </AploseSkeleton>
        </Switch>
      </Router>
    </IonApp>
  )
}

export default App;
