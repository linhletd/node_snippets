import HomePage from '../pages/home_page.js';
import SubDiscussLayout from '../pages/discuss_page.js';
import PrimaryHeader from '../ui/primary_header.js'
const PrimaryLayout = function(props){

    return(
        <div>
            <PrimaryHeader/>
            <Switch>
                <Route exact path = '/'>
                    <HomePage/>
                </Route>
                <Route exact path = '/user'>
                    <SubUserLayout/>
                </Route>
                <Route exact path = '/discuss'>
                    <SubDiscussLayout/>
                </Route>
            </Switch>
        </div>
    )
}
module.exports = PrimaryLayout;