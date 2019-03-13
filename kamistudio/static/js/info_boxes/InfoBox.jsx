// class InfoItems extends React.Component {
// 	constructor(props) {
// 		super(props);
// 	}

// 	render() {
// 		return ();
// 	}
// }

class InfoBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {

		return (
			[<h3>{this.props.name}</h3>,
            <p id={this.props.id + "noSelectedElements"}>Click on an element to select</p>,
            <p id={this.props.id + "badElementType"}>Not available for this type of element</p>,
            <p id={this.props.id + "noData"}>No data available</p>,
            <div id="selectedElementInfo">
            	{/*<InfoItems id={this.props.id} items={this.props.items}/>*/}
            </div>]
		);
	}
}
