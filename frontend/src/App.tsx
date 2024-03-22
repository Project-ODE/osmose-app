import { FC } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';


import { Login } from "@/view/login.page.tsx";
import { DatasetList } from "@/view/dataset-list";
import { AnnotationCampaignList } from "@/view/annotation-campaign-list.page.tsx";
import { AnnotationCampaignDetail } from "@/view/annotation-campaign-detail.page.tsx";
import { EditCampaign } from "@/view/create-campaign/edit-campaign.page.tsx";
import { AnnotationTaskList } from "@/view/annotation-task-list.page.tsx";
import { AuthenticatedRoute } from "@/view/global-components";
import { AudioAnnotator } from "@/view/audio-annotator/audio-annotator.page.tsx";
import { CreateCampaign } from "@/view/create-campaign/create-campaign.page";

import { StaffOnlyRoute } from "@/routes/staff-only";
import { AploseSkeleton } from "@/view/global-components/skeleton/skeleton.component.tsx";

import './css/fontawesome/css/fontawesome-5.15.4.min.css';
import './css/fontawesome/css/solid.min.css'
import './css/fontawesome/css/regular.min.css'
import './css/bootstrap-4.1.3.min.css';
import '@ionic/react/css/core.css';
import './css/ionic-override.css';
import './css/app.css';

import { IonApp, setupIonicReact } from '@ionic/react';

import { Provider } from "react-redux";
import { AppStore } from "@/slices/app.ts";

setupIonicReact({
  mode: 'md',
  spinner: 'crescent',
});


export const App: FC = () => {
  return (
    <Provider store={ AppStore }>
      <IonApp>
        <Router basename='/app'>
          <Switch>
            <Route path="/login"><Login/></Route>

            <AuthenticatedRoute path='/audio-annotator/:id'><AudioAnnotator/></AuthenticatedRoute>

            <AploseSkeleton>
              <Switch>
                <AuthenticatedRoute exact path='/datasets'><DatasetList/></AuthenticatedRoute>
                <AuthenticatedRoute exact path='/annotation-campaigns'><AnnotationCampaignList/></AuthenticatedRoute>
                <AuthenticatedRoute exact path='/create-annotation-campaign'><CreateCampaign/></AuthenticatedRoute>
                <AuthenticatedRoute exact path='/annotation_campaign/:id/edit'>
                  <StaffOnlyRoute><EditCampaign/></StaffOnlyRoute>
                </AuthenticatedRoute>
                <AuthenticatedRoute exact
                                    path='/annotation_campaign/:id'><AnnotationCampaignDetail/></AuthenticatedRoute>
                <AuthenticatedRoute exact path='/annotation_tasks/:id'><AnnotationTaskList/></AuthenticatedRoute>
                <Route path="**"><Redirect to="/annotation-campaigns"/></Route>
              </Switch>
            </AploseSkeleton>
          </Switch>
        </Router>
      </IonApp>
    </Provider>
  )
}

export default App;
