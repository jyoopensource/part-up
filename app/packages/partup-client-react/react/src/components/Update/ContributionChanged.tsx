
import * as React from 'react';
import * as c from 'classnames';
import './ContributionChanged.css';

interface Props {
    className?: string;
}

export class ContributionChanged extends React.Component<Props, {}> {

    getClassNames() {
        const { className } = this.props;

        return c('pur-ContributionChanged', className, {

        });
    }

    render() {
        return (
            <div className={this.getClassNames()}>
                { `contribution_changed` }
            </div>
        );
    }
}
