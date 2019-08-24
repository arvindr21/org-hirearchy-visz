import { select, tree, hierarchy, linkVertical, zoom, event, zoomIdentity } from 'd3';
import EventEmitter from './eventemitter';

export const CARD_CLICKED_EVENT = 'CardClickedEvent';
export const DEPT_CLICK_EVENT = 'DeptClickEvent';
export const DATA_URL = 'https://raw.githubusercontent.com/bumbeishvili/Assets/master/Projects/D3/Organization%20Chart/redesignedChartLongData.json';

const defaultProps = {
  EXPAND_SYMBOL: '\uf067',
  COLLAPSE_SYMBOL: '\uf068',
  index: 0,
  nodePadding: 9,
  collapseCircleRadius: 7,
  nodeHeight: 80,
  nodeWidth: 210,
  duration: 750,
  rootNodeTopMargin: 20,
  minMaxZoomProportions: [0.05, 3],
  linkLineSize: 180,
  collapsibleFontSize: '10px',
  userIcon: '\uf007',
  nodeStroke: "#ccc",
  nodeStrokeWidth: '1px',
  centerMySelf: false,
  locate: null,
  mode: null
};


export class OrgTreeChart extends EventEmitter {
  constructor(props){
    super();
    // update the options
    this.options = Object.assign({}, defaultProps, props);

    // dynamic options TBD need to add more context
    this.dynamic = {};
    this.dynamic.nodeImageWidth = this.options.nodeHeight * 100 / 140;
    this.dynamic.nodeImageHeight = this.options.nodeHeight - 2 * this.options.nodePadding;
    this.dynamic.nodeTextLeftMargin = this.options.nodePadding * 2 + this.dynamic.nodeImageWidth;
    this.dynamic.rootNodeLeftMargin = this.options.width / 2;
    this.dynamic.nodePositionNameTopMargin = this.options.nodePadding + 8 + this.dynamic.nodeImageHeight / 4 * 1;
    this.dynamic.nodeChildCountTopMargin = this.options.nodePadding + 14 + this.dynamic.nodeImageHeight / 4 * 3;

    // Set the dimensions and margins of the diagram
    // this also to be moved to options TBD
    this.margin = {top: 20, right: 20, bottom: 20, left: 20};
    this.width = window.innerWidth - this.margin.left - this.margin.right,
    this.height =  window.innerHeight - this.margin.top - this.margin.bottom;

    // backup the data
    this.orgData = JSON.parse(JSON.stringify(this.options.treeData));
    this.oldData = null;

    // initialize the tree structure
    this.initTreeStructure();
    this.update(this.root);
  }

  initTreeStructure(){

    // prep the data :: to be moved to own function
    if (this.options.mode != 'department') { 
      // adding unique values to each node recursively
      var uniq = 1;
      this.addPropertyRecursive('uniqueIdentifier', function(v) {
        return uniq++;
      }, this.options.treeData);

    }

    this.zoomEvent = zoom()
    // .scaleExtent(this.options.minMaxZoomProportions)
    // .extent([this.dynamic.rootNodeLeftMargin, this.options.rootNodeTopMargin])
    .on('zoom', ()=>{
        this.svg.attr("transform", event.transform);
    });
    

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = select(this.options.ref).append("svg")
      .attr("width", this.width + this.margin.right + this.margin.left)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .call(this.zoomEvent)
      .append("g")
      .attr("transform", "translate("+ ((this.width/2) - 20)  + "," + this.margin.top + ")");

    // declares a tree layout and assigns the size
    this.treemap = tree().nodeSize([this.options.nodeWidth + 40, this.options.nodeHeight]);
    // .size([this.width, this.height])

    // Assigns parent, children, height, depth
    this.root = hierarchy(this.options.treeData, function(d) { return d.children; });
    this.root.x0 = 0;
    this.root.y0 = this.width/2;

    this.linkGenerator = linkVertical()
      .x(d => d.x+this.options.nodeWidth/2)
      .y(d => d.y+this.options.nodeHeight/2);

    // Collapse after the second level
    this.root.children.forEach(this.collapse.bind(this));

  }

   getEmployeesCount(node) {
    var count = 1;
    countChilds(node);
    return count;

    function countChilds(node) {
      var childs = node.children ? node.children : node._children;
      if (childs) {
        childs.forEach(function(v) {
          count++;
          countChilds(v);
        })
      }
    }
  }

  updateDepartmentTree(item){

    if (item.type == 'department' && this.options.mode != 'department') {
      
      //find third level department head user
      let found = false;
      let secondLevelChildren = this.orgData.children;

      parentLoop:
        for (var i = 0; i < secondLevelChildren.length; i++) {
          var secondLevelChild = secondLevelChildren[i];
          var thirdLevelChildren = secondLevelChild.children ? secondLevelChild.children : secondLevelChild._children;

          for (var j = 0; j < thirdLevelChildren.length; j++) {
            var thirdLevelChild = thirdLevelChildren[j];
            if (thirdLevelChild.unit.value.trim() == item.value.trim()) {
              this.clearChart();

              let deptData = {
                value:item.value,
                desc: thirdLevelChild.unit.desc,
                count: this.getEmployeesCount(thirdLevelChild)
              };

              this.emit(DEPT_CLICK_EVENT,deptData);

              this.oldData = this.options.treeData;
              this.options.treeData = this.deepClone(thirdLevelChild);
              found = true;
              break parentLoop;
            }
          }
        }

      if (found) {
        this.options.mode = "department";
        this.initTreeStructure();
        this.update(this.root);
      }

    }
  }

  clearChart(){
    // clear the chart....
    select(this.options.ref).html("");
  }

  deepClone(item) {
    return JSON.parse(JSON.stringify(item));
  }

  setToggleSymbol(d, symbol) {
    d.data.collapseText = symbol;
  }

  update(source){
    // Assigns the x and y position for the nodes
    let treeData = this.treemap(this.root);

    // Compute the new tree layout.
    let nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach((d) => { 
      d.y = d.depth * this.options.linkLineSize;
    });

    // ****************** Nodes section ***************************

    // Update the nodes...
    let node = this.svg.selectAll('g.node')
        .data(nodes, (d) => {return d.id || (d.id = ++this.options.index); });

    // Enter any new modes at the parent's previous position.
    let nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", (d) => {
        return "translate(" + source.x0 + "," + source.y0 + ")";
      })
      .on('click', (d)=>{ this.emit(CARD_CLICKED_EVENT,d.data); });

    let nodeGroup = nodeEnter.append("g")
      .attr("class", "node-group");

    // Add card styles for the node
    nodeGroup.append("rect")
      .attr("width", this.options.nodeWidth)
      .attr("height", this.options.nodeHeight)
      .attr("data-node-group-id",function(d){
        return d.data.uniqueIdentifier;
      })
      .attr("class", function(d) {
        var res = "";
        if (d.data.isLoggedUser) res += 'nodeRepresentsCurrentUser ';
        res += d.data._children || d.data.children ? "nodeHasChildren" : "nodeDoesNotHaveChildren";
        return res;
      });

    // Plus and Minus icons for the nodes
    let collapsiblesWrapper = nodeEnter.append('g')
      .attr('data-id', function(v) {
        return v.data.uniqueIdentifier;
      });

    // Add labels for the nodes
    let collapsibleRects = collapsiblesWrapper.append("rect")
      .attr('class', 'node-collapse-right-rect')
      .attr('height', this.options.collapseCircleRadius)
      .attr('fill', 'black')
      .attr('x', this.options.nodeWidth - this.options.collapseCircleRadius)
      .attr('y', this.options.nodeHeight - 7)
      .attr("width", (d) => {
        if (d.data.children || d.data._children) return this.options.collapseCircleRadius;
        return 0;
      });

    let collapsibles = collapsiblesWrapper.append("circle")
      .attr('class', 'node-collapse')
      .attr('cx', this.options.nodeWidth - this.options.collapseCircleRadius)
      .attr('cy', this.options.nodeHeight - 7)
      .attr("", this.setCollapsibleSymbolProperty.bind(this));

    //hide collapse rect when node does not have children
    collapsibles.attr("r", (d) => {
        if (d.data.children || d.data._children) return this.options.collapseCircleRadius;
        return 0;
      })
      .attr("height", this.options.collapseCircleRadius);

    collapsiblesWrapper.append("text")
      .attr('class', 'text-collapse')
      .attr("x", this.options.nodeWidth - this.options.collapseCircleRadius)
      .attr('y', this.options.nodeHeight - 3)
      .attr('width', this.options.collapseCircleRadius)
      .attr('height', this.options.collapseCircleRadius)
      .style('font-size', this.options.collapsibleFontSize)
      .attr("text-anchor", "middle")
      .style('font-family', 'FontAwesome')
      .text(function(d) {
        return d.data.collapseText;
      });

    let _self = this;
    collapsiblesWrapper.on("click", function(d){
      _self.toggleChildren(d, this);
    });

    nodeGroup.append("text")
      .attr("x", this.dynamic.nodeTextLeftMargin)
      .attr("y", this.options.nodePadding + 10)
      .attr('class', 'emp-name')
      .attr("text-anchor", "left")
      .text(function(d) {
        return d.data.name.trim();
      })
      .call(this.wrap, this.options.nodeWidth);

    nodeGroup.append("text")
      .attr("x", this.dynamic.nodeTextLeftMargin)
      .attr("y", this.dynamic.nodePositionNameTopMargin)
      .attr('class', 'emp-position-name')
      .attr("dy", ".35em")
      .attr("text-anchor", "left")
      .text(function(d) {
        let position =  d.data.positionName.substring(0,27);
        if(position.length<d.data.positionName.length){
          position = position.substring(0,24)+'...'
        }
        return position;
      });

    nodeGroup.append("text")
      .attr("x", this.dynamic.nodeTextLeftMargin)
      .attr("y", this.options.nodePadding + 10 + this.dynamic.nodeImageHeight / 4 * 2)
      .attr('class', 'emp-area')
      .attr("dy", ".35em")
      .attr("text-anchor", "left")
      .text(function(d) {
        return d.data.area;
      });

    nodeGroup.append("text")
      .attr("x", this.dynamic.nodeTextLeftMargin)
      .attr("y", this.dynamic.nodeChildCountTopMargin)
      .attr('class', 'emp-count-icon')
      .attr("text-anchor", "left")
      .style('font-family', 'FontAwesome')
      .text((d) => {
        if (d.children || d._children) return this.options.userIcon;
      });

    nodeGroup.append("text")
      .attr("x", this.dynamic.nodeTextLeftMargin + 13)
      .attr("y", this.dynamic.nodeChildCountTopMargin)
      .attr('class', 'emp-count')
      .attr("text-anchor", "left")
      .text(function(d) {
        if (d.children) return d.children.length;
        if (d._children) return d._children.length;
        return;
      });

    nodeGroup.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("id", "clip-rect")
      .attr("rx", 3)
      .attr('x', this.options.nodePadding)
      .attr('y', 2 + this.options.nodePadding)
      .attr('width', this.dynamic.nodeImageWidth)
      .attr('fill', 'none')
      .attr('height', this.dynamic.nodeImageHeight - 4);

    nodeGroup.append("svg:image")
      .attr('y', 2 + this.options.nodePadding)
      .attr('x', this.options.nodePadding)
      .attr('preserveAspectRatio', 'none')
      .attr('width', this.dynamic.nodeImageWidth)
      .attr('height', this.dynamic.nodeImageHeight - 4)
      .attr('clip-path', "url(#clip)")
      .attr("xlink:href", function(v) {
        return v.data.imageUrl;
      });

    // UPDATE
    let nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(this.options.duration)
      .attr("transform", (d) => { 
          return "translate(" + d.x + "," + d.y + ")";
      });

    // Update the node attributes and style
    nodeUpdate.select("rect")
      .attr("width", this.options.nodeWidth)
      .attr("height", this.options.nodeHeight)
      .attr('rx', 3)
      .attr("stroke", (d) => {
        return this.options.nodeStroke;
      })
      .attr('stroke-width', (d) => {
        return this.options.nodeStrokeWidth
      });


    // Remove any exiting nodes
    let nodeExit = node.exit().transition()
        .duration(this.options.duration)
        .attr("transform", function(d) {
            return "translate(" + source.x + "," + source.y + ")";
        })
        .remove();

    nodeExit.select("rect")
      .attr("width", this.options.nodeWidth)
      .attr("height", this.options.nodeHeight)

    // ****************** links section ***************************
    // Update the links...
    let link = this.svg.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    let linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr("x", this.options.nodeWidth / 2)
        .attr("y", this.options.nodeHeight / 2)
        .attr('d', (d) => {
          let o = {x: source.x0, y: source.y0};
          let linkData = {source:o, target:o};
          return this.linkGenerator(linkData)
        });

    // UPDATE
    let linkUpdate = link.merge(linkEnter);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(this.options.duration)
        .attr('d', (d) => { return this.linkGenerator({source:d, target:d.parent}) });

    // Remove any exiting links
    let linkExit = link.exit().transition()
        .duration(this.options.duration)
        .attr('d', (d) => {
          let o = {x: source.x, y: source.y};
          let linkData = {source:o, target:o};
          return this.linkGenerator(linkData)
        })
        .remove();

    let selfX;
    let selfY;

    // Store the old positions for transition.
    nodes.forEach((d) => {
      d.x0 = d.x;
      d.y0 = d.y;

      if (d.data.uniqueIdentifier == this.options.locate) {
        selfX = d.x;
        selfY = d.y;
      }

      if (d.data.isLoggedUser && this.options.centerMySelf) {
        selfX = d.x;
        selfY = d.y;
      }
      
    });



    if(this.options.centerMySelf || this.options.locate != null){

      // normalize for width/height
      let new_x = (-selfX + (window.innerWidth / 2));
      let new_y = (-selfY + (window.innerHeight / 2));

      // translate and scale to the my self card
      this.svg.transition()
      .duration(750)
      .call(this.zoomEvent.transform, zoomIdentity)
      .attr("transform", "translate(" + new_x + "," + new_y + ")");

      this.options.centerMySelf = false;
      this.options.locate = null;

    }
    
  }

  //toggle the plus and minus icons
  setCollapsibleSymbolProperty(d) {
    if (d.data._children) {
      d.data.collapseText = this.options.EXPAND_SYMBOL;
    } else if (d.children) {
      d.data.collapseText = this.options.COLLAPSE_SYMBOL;
    }
  }

  // styles for the text TBD
  wrap(text, width) {

    text.each(function() {
      var text = select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        x = text.attr("x"),
        y = text.attr("y"),
        dy = 0, //parseFloat(text.attr("dy")),
        tspan = text.text(null)
        .append("tspan")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(word);
        }
      }
    });

  }

  // add unique properties to the nodes and node groups
  addPropertyRecursive(propertyName, propertyValueFunction, element) {
    if (element[propertyName]) {
      element[propertyName] = element[propertyName] + ' ' + propertyValueFunction(element);
    } else {
      element[propertyName] = propertyValueFunction(element);
    }
    if (element.children) {
      element.children.forEach((v) => {
        this.addPropertyRecursive(propertyName, propertyValueFunction, v)
      })
    }
    if (element._children) {
      element._children.forEach((v) => {
        this.addPropertyRecursive(propertyName, propertyValueFunction, v)
      })
    }
  }

  // Toggle children on click.
  toggleChildren(d, el) {
    select(el).select("text").text((dv) => {
      if (dv.data.collapseText == this.options.EXPAND_SYMBOL) {
        dv.data.collapseText = this.options.COLLAPSE_SYMBOL
      } else {
        if (dv.children) {
          dv.data.collapseText = this.options.EXPAND_SYMBOL
        }
      }
      return dv.data.collapseText;
    });

    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }

    this.options.centerMySelf = false;
    this.options.locate = null;
    this.update(d);
  }

  //Collapse the node and all it's children
  collapse(d) {
    if(d.children) {
      d._children = d.children;
      d._children.forEach(this.collapse.bind(this));
      d.children = null;
    }

    if (d._children) {
      // if node has children and it's collapsed, then  display +
      this.setToggleSymbol(d, this.options.EXPAND_SYMBOL);
    }
  }

  showMySelf() {

    // if you are in department mode get out of it first.
    if(this.options.mode == 'department') {
      this.clearChart();
      this.options.mode = null;
      this.options.treeData = this.deepClone(this.oldData);
      this.initTreeStructure();
    }

    /* collapse all and expand logged user nodes */
    if (!this.root.children) {
      if (!this.root.data.isLoggedUser) {
        this.root.children = this.root._children;
      }
    }
    if (this.root.children) {
      this.root.children.forEach(this.collapse.bind(this));
      this.root.children.forEach(this.findmySelf.bind(this));
    }

    this.options.centerMySelf = true;
    this.update(this.root);
  }

  /* recursively find logged user in subtree */
  findmySelf(d) {
    if (d.data.isLoggedUser) {
      this.expandParents(d);
    } else if (d._children) {
      d._children.forEach((ch) => {
        ch.parent = d;
        this.findmySelf(ch);
      })
    } else if (d.children) {
      d.children.forEach((ch) => {
        ch.parent = d;
        this.findmySelf(ch);
      });
    };

  }

  /* expand current nodes collapsed parents */
  expandParents(d) {
    while (d.parent) {
      d = d.parent;
      if (!d.children) {
        d.children = d._children;
        d._children = null;
        this.setToggleSymbol(d, this.options.COLLAPSE_SYMBOL);
      }

    }
  }

  /**
   * search in the tree data
   */
  findInTree(searchText) {

    let result = [];
    let rootData = this.options.mode == 'department' ? this.deepClone(this.oldData) : this.deepClone(this.options.treeData);

    // use regex to achieve case insensitive search and avoid string creation using toLowerCase method
    var regexSearchWord = new RegExp(searchText, "i");

    recursivelyFindIn(rootData, searchText);

    return result;

    function recursivelyFindIn(user) {
      if (user.name.match(regexSearchWord) ||
        user.tags.match(regexSearchWord)) {
        result.push(user)
      }

      var childUsers = user.children ? user.children : user._children;
      if (childUsers) {
        childUsers.forEach(function(childUser) {
          recursivelyFindIn(childUser, searchText)
        })
      }
    };

  }

  //locateRecursive
  locate(id){

    // if you are in department mode get out of it first.
    if(this.options.mode == 'department') {
      this.clearChart();
      this.options.mode = null;
      this.options.treeData = this.deepClone(this.oldData);
      this.initTreeStructure();
    }

     /* collapse all and expand logged user nodes */
    if (!this.root.children) {
      if (!this.root.data.uniqueIdentifier == id) {
        this.root.children = this.options.treeData._children;
      }
    }
    if (this.root.children) {
      this.root.children.forEach(this.collapse.bind(this));
      this.root.children.forEach((ch) => {
        this.locateRecursive(ch,id)
      });
    }

    this.options.locate = id;
    this.update(this.root);
  }

  locateRecursive(d,id) {
    if (d.data.uniqueIdentifier == id) {
      this.expandParents(d);
    } else if (d._children) {
      d._children.forEach((ch) => {
        ch.parent = d;
        this.locateRecursive(ch,id);
      })
    } else if (d.children) {
      d.children.forEach((ch) => {
        ch.parent = d;
        this.locateRecursive(ch,id);
      });
    };

  }

  back(){
    // if you are in department mode get out of it first.
    this.clearChart();
    this.options.mode = null;
    this.options.treeData = this.deepClone(this.oldData);
    this.initTreeStructure();
    this.update(this.root);
  }

};