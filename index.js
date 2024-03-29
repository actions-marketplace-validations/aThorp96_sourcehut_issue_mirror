 core = require('@actions/core');
const github = require('@actions/github');
var request = require('request');

try {
	const title = core.getInput('title');
	const body = core.getInput('body');
	const submitter = core.getInput('submitter');
	const submitter_id = `github.com:${submitter}`
	const submitter_url = `https://github.com/${submitter}`
	const tracker_owner = core.getInput('tracker-owner');
	const tracker_name = core.getInput('tracker-name');
	const oauth_token = core.getInput('oauth-token');
	var repository = core.getInput('label');
	var repo_name = repository.split("/");

	// If the repo name was provided from the ENV variable,
	// it will be in the format OWNER/REPO
	if (repo_name.length > 1) {
		repo_name = repo_name[1];
  	} else {
  		repo_name = repo_name[0];
  	}

	// If the repository was not provided, error
  	if (repo_name == "") {
      	throw "Repository not passed in as label: \"${repository}\""
  	}

	var uri = `https://todo.sr.ht/api/user/${tracker_owner}/trackers/${tracker_name}/tickets`;
	var description = `Issue mirrored from [github](https://github.com/${repository}).\n\nOpened by [${submitter}](${submitter_url}).\n\n${body}`;

	create_issue(uri, oauth_token, title, description, submitter_id, submitter_url, repo_name)

} catch (error) {
	  core.setFailed(error.message);
}

function create_issue(uri, oauth_token, title, description, submitter_id, submitter_url, repo) {
	return request(
		{
			method: 'POST',
			url: uri,
			headers: {
			'Authorization': `token ${oauth_token}`,
			'Content-Type': 'application/json'
			},
			body: JSON.stringify({
			'title': title,
			'description': description,
			'external_id': submitter_id,
			'external_url': submitter_url
			})
		},
		(error, res, body) => {
			if (error) {
				console.error(error)
				return
			}
			console.log(JSON.parse(res.body).id)
			ticket_id = JSON.parse(res.body).id

			if (res.statusCode != 201) {
				core.setFailed(`Failed to post: ${res.body}`);
				return
			}
			console.log("Successfully opened issue")
			annotate_ticket(uri, ticket_id, oauth_token, repo)
	}
	)

}

function annotate_ticket(uri, id, oauth_token, repo) {
	console.log(`Adding label ${repo} to ${uri}/${id}`)
	request(
		{
			method: 'PUT',
			url: `${uri}/${id}`,
			headers: {
			'Authorization': `token ${oauth_token}`,
			'Content-Type': 'application/json'
			},
			body: JSON.stringify({
			'labels': [repo]
			}),
		},
		(error, res, body) => {
			if (error) {
				console.error(error)
				return
			}
			console.log(`Status Code: ${res.statusCode}`)
			if (res.statusCode != 200) {
				core.setFailed(`Failed to update issue: ${body}`);
				return
			}
			console.log("Successfully labeled issue")
	}
	)
}


