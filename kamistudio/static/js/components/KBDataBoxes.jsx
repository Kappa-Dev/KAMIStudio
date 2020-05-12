/**
 * Collection of customized boxes for displaying knowledge (model/corpus) base data.
 */


function RateDataBox(props) {
	var rateItems = [
		["default_bnd_rate", "Binding rate", props.default_bnd_rate ? props.default_bnd_rate : <p className="faded">not specified</p>],
		["default_brk_rate", "Unbinding rate", props.default_brk_rate ? props.default_brk_rate : <p className="faded">not specified</p>],
		["default_mod_rate", "Modification rate", props.default_mod_rate ? props.default_mod_rate : <p className="faded">not specified</p>]
	];

	var rateData = {
		default_bnd_rate: props.default_bnd_rate,
		default_brk_rate: props.default_brk_rate,
		default_mod_rate: props.default_mod_rate, 
	};
	return (
		<EditableBox id={props.id}
			 name="Default interaction rates"
			 items={rateItems}
			 editable={true}
			 expandable={false}
			 expanded={true}
			 readonly={props.readonly}
			 onDataUpdate={props.onDataUpdate}
			 data={rateData}
			 noBorders={true}
			 protected={[]}
			 instantiated={props.instantiated} />
	)
}


class KBMetaDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {

		var items = [
			["name", "Name", this.props.kbName ? this.props.kbName : <p className="faded">not specified</p>],
			["desc", "Desciption", this.props.desc ? this.props.desc : <p className="faded">not specified</p>],
			// ["organism", "Organism", this.props.organism ? this.props.organism : <p className="faded">not specified</p>],
			["creation_time", "Created", this.props.creation_time],
			["last_modified", "Last modified", this.props.last_modified]
		];
		var data = {
			"name": this.props.kbName,
			"desc": this.props.desc,
			// "organism": this.props.organism,
			"creation_time": this.props.creation_time,
			"last_modified": this.props.last_modified
		}

		return (
			<EditableBox id={this.props.id}
						 name={this.props.name}
						 items={items}
						 editable={this.props.editable}
						 readonly={this.props.readonly}
						 onDataUpdate={this.props.onDataUpdate}
						 data={data}
						 noBorders={true}
						 expandable={this.props.expandable}
						 expanded={true}
						 protected={this.props.protected}
						 instantiated={this.props.instantiated}
						 onDataUpdate={this.props.onDataUpdate}/>);
	}
}


class InteractionsDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var geneItems = this.props.genes ? JSON.parse(this.props.genes) : undefined,
			proteinItems = this.props.proteins ? JSON.parse(this.props.proteins) : undefined,
			modItems = this.props.modifications ? JSON.parse(this.props.modifications) : undefined,
			bndItems = this.props.bindings ? JSON.parse(this.props.bindings): undefined;
		
		return ([
			<h3 className="info-brand">Interactions</h3>,
    		<div className="table-responsive">
      			<table className="table info">
       				<tbody>
       					<DropDownRow name="Protoforms" items={geneItems}/>
       					<DropDownRow name="Proteins" items={proteinItems}/>
			          	<DropDownRow name="Modification mechanisms" items={modItems}/>
			          	<DropDownRow name="Bindings mechanisms" items={bndItems}/>
			        </tbody>
			    </table> 
			</div>
		]);
	}
}




class ModelDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var originCorpus;
		if (this.props.corpusId) {
			originCorpus = 
				<b>
					<a className="instantiation-link" href={this.props.corpusUrl}>
						{this.props.corpusName}
					</a>
				</b>;
		} else {
		    originCorpus = <p>No corpus associated</p>;
		}

		var seedGenes = this.props.seedGenes ? JSON.parse(this.props.seedGenes) : {},
			definitions = this.props.definitions ? JSON.parse(this.props.definitions) : {};
		
		return ([
			<div id="modelMetaData">
				<KBMetaDataBox
					id="modelMetaData"
					name={null}
					editable={true}
					readonly={this.props.readonly}
					kbName={this.props.kbName}
					desc={this.props.desc}
					organism={this.props.organism}
					creation_time={this.props.creation_time}
					last_modified={this.props.last_modified}
					protected={["creation_time", "last_modified"]}
					instantiated={true}
					onDataUpdate={this.props.onDataUpdate}/>
			</div>,
			<hr className="sidebar-corpus-sep"/>,
			<h3 className="info-brand">Origin</h3>,
		    <div className="table-responsive">
		      <table className="table table info-table no-borders">
		        <tbody>
		          <tr>
		            <th scope="row">Corpus </th>
		            <td>
		              {originCorpus}
		            </td>
		          </tr>
		         {/* <DropDownRow name="Seed genes" items={seedGenes} />
		          <DropDownRow name="Definitions" items={definitions} />*/}
		        </tbody>
		      </table> 
    		</div>,
    		<hr className="sidebar-corpus-sep"/>,
   			<InteractionsDataBox
   				proteins={this.props.proteins}
   				modifications={this.props.modifications}
   				bindings={this.props.bindings}/>,
   			<hr className="sidebar-corpus-sep"/>,
			<div id="modelRateData">
				<RateDataBox
					id="modeRateDataBox"
					default_bnd_rate={this.props.default_bnd_rate}
					default_brk_rate={this.props.default_brk_rate}
					default_mod_rate={this.props.default_mod_rate}
					readonly={this.props.readonly}
					onDataUpdate={this.props.onRateDataUpdate}
					instantiated={true}/>
			</div>
		]);
				
	}
}

class CorpusDataBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var genes, modifications, bindings;
		genes = 
			<th scope="row">
				<span className="glyphicon glyphicon-menu-right" aria-hidden="true"></span> Genes ({ this.props.nGenes })
			</th>;
		modifications = <th scope="row"><span className="glyphicon glyphicon-menu-right" aria-hidden="true"></span> Modifications ({ this.props.nModifications })</th>;
		bindings = <th scope="row"><span className="glyphicon glyphicon-menu-right" aria-hidden="true"></span> Bindings ({ this.props.nBindings })</th>;
		return([
			<div id="modelMetaData">
				<KBMetaDataBox
					id="corpusMetaData"
					name={null}
					editable={true}
					readonly={this.props.readonly}
					kbName={this.props.kbName}
					desc={this.props.desc}
					organism={this.props.organism}
					creation_time={this.props.creation_time}
					last_modified={this.props.last_modified}
					protected={["creation_time", "last_modified"]}
					onDataUpdate={this.props.onDataUpdate}/>
			</div>,
			<hr className="sidebar-corpus-sep"/>,
   			<InteractionsDataBox
   				genes={this.props.genes}
   				modifications={this.props.modifications}
   				bindings={this.props.bindings}/>
		]);
	}
}