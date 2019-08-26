import React, { Component } from 'react';

let buildResults = (results, clickEvent) => {

  if(results.length == 0) { return (<div className="buffer" ></div>)}

  return results.map((value, index) => {
    let { imageUrl, name, positionName, area, profileUrl, uniqueIdentifier } = value;
    return (
      <div key={index} className="list-item">
        <a>
          <div className="image-wrapper">
            <img className="image" src={imageUrl}/>
          </div>

          <div className="description">
            <p className="name">{name}</p>
            <p className="position-name">{positionName}</p>
            <p className="area">{area}</p>
          </div>
          <div className="buttons">
            <a target='_blank' href={profileUrl}><button class='btn-search-box  btn-action'>ViewProfile</button></a>
            <button id={uniqueIdentifier} className='btn-search-box btn-action btn-locate' onClick={clickEvent}>Locate</button>
          </div>
        </a>
      </div>
    )
  });
}

export default class Search extends Component{
  constructor(props){
    super(props);
  }

  setWidth(show){
    if(show){
      return { width: '350px' };
    }
    return { width: '0px' };
  }

  render(){
    return (
      <div className="user-search-box" style={this.setWidth(this.props.showSearch)}>
        <div className="input-box">
          <div className="close-button-wrapper"><i onClick={this.props.closeSearch} className="fa fa-times" aria-hidden="true"></i></div>
          <div className="input-wrapper">
            <input type="text" className="search-input" placeholder="Search" onChange={this.props.onTextChange}/>
            <div className="input-bottom-placeholder">By Firstname, Lastname, Tags</div>
          </div>
          <div>
          </div>
        </div>
        <div className="result-box">
          <div className="result-header"> RESULTS </div>
          <div className="result-list">
            {buildResults(this.props.searchResults, this.props.clickResult)}
          </div>
        </div>
      </div>
    )
  }
}