import React from 'react';
import styled from 'styled-components';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import StartPage from './pages/StartPage';
import MainPage from './pages/MainPage';
import MinutesListPage from './pages/MinutesListPage';
import MeetingRoomPage from './pages/MeetingRoomPage';
import OAuth2RedirectHandler from './handlers/OAuth2RedirectHandler';

import Header from './containers/Header';
import Modal from './containers/modal/index';
import MeetingLogPage from './pages/MeetingLogPage';

const AppLayout = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Header />
        <Switch>
          <Route path="/" component={StartPage} exact />
          <Route path="/main" component={MainPage} />
          <Route path="/minuteslist" component={MinutesListPage} />
          <Route exact path="/meeting/:roomId" component={MeetingRoomPage} />
          <Route path="/meetinglog/:code" component={MeetingLogPage} />
          <Route
            path="/oauth2/redirect"
            component={OAuth2RedirectHandler}
          ></Route>
          <Route
            render={({ location }) => (
              <div>
                <h2>Page 404.</h2>
                <p>{location.pathname}</p>
              </div>
            )}
          />
        </Switch>
      </AppLayout>
      <Modal />
    </BrowserRouter>
  );
}

export default App;
