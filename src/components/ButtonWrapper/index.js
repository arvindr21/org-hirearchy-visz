import React, { Component } from 'react';

export default class ButtonWrapper extends Component {
  constructor(props){
    super(props);
  }

  render(){
    return (
      <div className="button-wrapper">
        <button className="btn-action btn-show-my-self" onClick={this.props.findMyself}>
          Show myself <span className='icon'><i className="fa fa-user"></i></span>
        </button>
        <button className="btn-action btn-search" onClick={this.props.openSearch}>
          Search <span className='icon'> <i className="fa fa-search" ></i></span>
        </button>
      </div>
    )
  }
}