
import * as React from 'react';
import * as c from 'classnames';
import './PartupCommentAdded.css';

interface Props {
    className?: string;
}

export class PartupCommentAdded extends React.Component<Props, {}> {

    getClassNames() {
        const { className } = this.props;

        return c('pur-PartupCommentAdded', className, {

        });
    }

    render() {
        return (
            <div className={this.getClassNames()}>
                { `partup_comment_added` }
            </div>
        );
    }
}
