class InteractionForm extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			interactionType: "mod"
			actionUrl: props.actionUrl
		}
	}

	render() {
		return([
			<h2 class="mb-6">Interaction type</h2>,
			<form id="interactionForm"
			      novalidate action={this.state.actionUrl}
			      method="post">
			</form>
	}
}