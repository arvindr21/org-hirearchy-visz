import React, { Component } from 'react';
import PersonCard from '../PersonCard';


export default class TooltipWrapper extends Component{
  constructor(props){
    super(props);
  }

  render(){
    if(this.props.showCardFlag){
      return (
        <div>
          <div className="customTooltipBackground" onClick={this.props.bgClick}></div>
          <PersonCard showCardFlag={this.props.showCardFlag} 
                      item={this.props.item} 
                      departmentClick={this.props.departmentClick} />
        </div>
      )
    }
    return (<div></div>);
  }
}