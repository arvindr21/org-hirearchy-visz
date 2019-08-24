import React, { Component } from 'react';

function getTagsFromCommaSeparatedStrings(tags) {
  return tags.split(',').map(function(v) {
    return <li key={v}><div className="tag">{v}</div></li>
  });
}

export default class PersonCard extends Component{
  constructor(props){
    super(props);
  }
  render(){

    let { item, showCardFlag, departmentClick } = this.props;

    if(!showCardFlag){
      return (<div></div>);
    }

    let { profileUrl, name, positionName, area, office, imageUrl, unit, tags } = item;
    let { type, value } = unit;
    let containerClass = showCardFlag ? "customTooltip" : "customTooltip hide";
    let imageStyle = {
      backgroundImage: 'url(' + imageUrl + ')',
    };
    let deptClass = (type == 'business') ? "btn btn-tooltip-department disabled " : "btn btn-tooltip-department";

    return (
      <div className={containerClass}>
        <div className="profile-image-wrapper" style={imageStyle}> </div>
        <div className="tooltip-hr"></div>
        <div className="tooltip-desc">
          <a className="name" href={profileUrl} target="_blank"> {name} </a>
          <p className="position">{positionName}</p>
          <p className="area">{area} </p>
          <p className="office">{office}</p>
          <button data-unit={JSON.stringify(unit)} className={deptClass} onClick={departmentClick}> {value} </button>
          <h4 className="tags-wrapper">
            <span className="title"><i className="fa fa-tags" aria-hidden="true"></i></span>
            <ul className="tags">{getTagsFromCommaSeparatedStrings(tags)}</ul> 
          </h4> 
        </div>
        <div className="bottom-tooltip-hr"></div>
      </div>
    )
  }
}