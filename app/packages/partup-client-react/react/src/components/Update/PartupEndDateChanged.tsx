
import * as React from 'react';
import * as c from 'classnames';
import './PartupEndDateChanged.css';

interface Props {
    className?: string;
}

export default class PartupEndDateChanged extends React.Component<Props, {}> {

    getClassNames() {
        const { className } = this.props;

        return c('pur-PartupEndDateChanged', className, {

        });
    }

    render() {
        const {
            children,
        } = this.props;

        return (
            <div className={this.getClassNames()}>
                { children }
            </div>
        );
    }
}