import * as React from 'react';
import * as PropTypes from 'prop-types';
import Meteor from 'utils/Meteor';
import Subscriber from 'utils/Subscriber';
import {
    Switch,
    Route,
} from 'react-router-dom';
import { User } from 'types/User';
import { error, success } from 'utils/notify';
import { routes, activeRoutes, onRouteChange } from 'utils/router';
import { View } from 'components/View/View';
import { DevelopmentNavigation } from 'implementations/DevelopmentNavigation';
import { Router } from 'components/Router/Router';
import { NotificationsManager } from 'components/NotificationsManager/NotificationsManager';
import { Dashboard } from 'views/Dashboard/Dashboard';
import { Home } from 'views/Home/Home';

const dev = process.env.REACT_APP_DEV;

interface Props {
    className?: string;
}

class Container extends React.Component<Props, {}> {

    static contextTypes = {
        router: PropTypes.object,
    };

    componentWillMount() {
        if (!dev) {
            onRouteChange((currentRoute: string) => {
                this.context.router.history.push(currentRoute);
            });
        }
    }

    render() {
        const { children } = this.props;

        if (dev) {
            return (
                <View>
                    <DevelopmentNavigation />
                    {children}
                </View>
            );
        }

        return (
            <View>
                <Router>
                    {children}
                </Router>
            </View>
        );
    }
}

interface State {
    user?: User;
    loginFailed: boolean;
}

export interface AppContext {
    user?: User;
    refetchUser: Function;
}

export class App extends React.Component<Props, State> {

    static childContextTypes = {
        user: PropTypes.object,
        refetchUser: PropTypes.func,
    };

    public state: State = {
        user: undefined,
        loginFailed: false,
    };

    private subscriptions = new Subscriber({
        subscriptions: [{
            name: 'users.loggedin',
        }],
        onChange: () => this.forceUpdate(),
    });

    getChildContext(): AppContext {
        const { user } = this.state;

        return {
            user,
            refetchUser: this.refetchUser,
        };
    }

    refetchUser = () => {
        this.setState({
            user: Meteor.user(),
        });
    }

    componentWillMount() {
        this.subscriptions.subscribe();
        this.refetchUser();
        // Meteor.loginWithPassword('ralph@part-up.com', 'Testpassword1')
        Meteor.Accounts.onLogin(() => {
            this.setState({ loginFailed: false });
            this.refetchUser();
            success({
                title: 'Login success',
                content: `Successfully logged in as ${Meteor.userId()}`,
            });
        });

        Meteor.Accounts.onLoginFailure(() => {
            this.setState({ loginFailed: true });
            error({
                title: 'Login failed',
                content: 'Failed to login...',
                error: new Error('Login failed'),
            });
        });

    }

    render() {
        const { loginFailed, user } = this.state;

        if (loginFailed) {
            return (
                <div>TODO: Login failed Please login @ partup</div>
            );
        }

        if (!user) {
            return (
                <div>TODO: Empty state</div>
            );
        }

        return (
            <Container>
                <Switch>
                    <Route path={'/home'} component={Dashboard}/>
                    { routes.filter((route) => !activeRoutes.includes(route)).map((route, index) => (
                        <Route key={index} path={route} component={Home} />
                    )) }
                </Switch>
                <NotificationsManager />
            </Container>
        );
    }
}
