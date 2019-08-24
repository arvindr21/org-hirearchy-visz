import React,{ Component } from 'react';
import './App.css';

import { json } from 'd3';

import { OrgTreeChart, CARD_CLICKED_EVENT, DEPT_CLICK_EVENT, DATA_URL } from './common/treefunctions';
import TooltipWrapper from './components/TooltipWrapper';
import ButtonWrapper from './components/ButtonWrapper';
import Search from './components/Search';
import DepartmentWrapper from './components/DepartmentWrapper';

class App extends Component {
  constructor() {
    this.chartObj = null;
    this.state = {
      showSearch: false,
      searchResults: [],
      showCardFlag: false,
      item:null,
      showBack: false,
      deptInfo: null
    }
  }

  componentDidMount(){
    //let chartObj = new SampleTreeChart({treeData});

    json(DATA_URL).then(res => {

      this.chartObj = new OrgTreeChart({treeData:res, ref:this.refs.orgChart});

      this.chartObj.subscribe(CARD_CLICKED_EVENT, (data)=>{
        // show the employee card 
        this.setState({
          showCardFlag: true,
          item:data
        });
      });

      this.chartObj.subscribe(DEPT_CLICK_EVENT, (data)=>{
        // show the back button
        this.setState({
          showCardFlag: false,
          showSearch: false,
          searchResults: [],
          showBack: true,
          deptInfo: data
        });
      });

    });
  }

  findMyself(event){
    this.chartObj.showMySelf();

     this.setState({
      showBack: false,
      deptInfo: null
    });

  }

  openSearch(event){
    this.setState({
      showSearch: true
    });
  }

  closeSearch(event){
    this.setState({
      showSearch: false,
      searchResults: []
    });
  }

  closePersonCard(){
    this.setState({
      showCardFlag: false
    });
  }

  departmentClick(event){
    let unit = JSON.parse(event.target.getAttribute('data-unit'));
    // create and draw the department tree
    this.chartObj.updateDepartmentTree(unit);
  }

  onTextChange(event){
    let searchText = event.target.value;
    let results = this.chartObj.findInTree(searchText);

    if(searchText.length >=3){
      // pass the results to view
      this.setState({
        searchResults: results
      });
    }
  }

  clickResult(event){
    let uniqId = event.target.getAttribute('id');
    this.chartObj.locate(uniqId);
    this.setState({
      showBack: false,
      deptInfo: null
    });
  }

  clickBack(){
    this.chartObj.back();
    this.setState({
      showBack: false,
      deptInfo: null
    });
  }


  render(){
    return (
      <div>
        <ButtonWrapper findMyself={this.findMyself.bind(this)} 
                       openSearch={this.openSearch.bind(this)} />

        <TooltipWrapper item={this.state.item} 
                        showCardFlag={this.state.showCardFlag} 
                        bgClick={this.closePersonCard.bind(this)}
                        departmentClick={this.departmentClick.bind(this)} />
                        
        <Search showSearch={this.state.showSearch} 
                closeSearch={this.closeSearch.bind(this)} 
                searchResults={this.state.searchResults} 
                onTextChange={this.onTextChange.bind(this)} 
                clickResult={this.clickResult.bind(this)} />

        <DepartmentWrapper clickBack={this.clickBack.bind(this)}
                           deptInfo={this.state.deptInfo}
                           showBack={this.state.showBack} />

        <div ref="orgChart"></div>

      </div>
    );
  }
}

export default App;
