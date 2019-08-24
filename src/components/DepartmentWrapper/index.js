import React, { Component } from 'react';

export default class DepartmentWrapper extends Component {
  constructor(props){
    super(props);
  }

  render(){

    let {deptInfo, showBack, clickBack} = this.props;
    
    if(!showBack){ return (<div></div>); }

    let { count, value, desc } = deptInfo;

    return (
      <div>
        <button className="btn-action btn-back" onClick={clickBack}> 
          Back <span className='icon'> <i className="fa fa-arrow-left"></i></span>
        </button>

        <div className="department-information">
          <div className="dept-name">
            {value}
          </div>
          <div className="dept-emp-count">
            {count}
          </div>
          <div className="dept-description">
            {desc}
          </div>
        </div>

      </div>
    );
  }
}

