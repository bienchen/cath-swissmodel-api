import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import red from "@material-ui/core/colors/red";
import LinearProgress from "@material-ui/core/LinearProgress";
import RemoteDataProvider from "./RemoteDataProvider";
import AuthTokenProvider from "./AuthTokenProvider";
import { Typography } from "@material-ui/core";

const styles = theme => ({
  root: {
    width: "100%"
  }
});

class SubmitCheckResultProvider extends Component {
  static defaultProps = {
    checkInterval: 2000,
    checkMaxAttempts: 50
  };

  // error: true                                       => error
  // authToken: false                                  => auth
  // authToken: true, taskId: false                    => submit
  // authToken: true, taskId: true, completed: false   => check
  // authToken: true, taskId: true, completed: true    => results

  constructor(props) {
    super(props);
    this.state = {
      message: "Waiting for message to be set",
      error: false,
      authToken: null,
      taskId: false,
      completed: false
    };
    this.checkAttempts = 0;
    this.handleError = this.handleError.bind(this);
    this.handleAuthToken = this.handleAuthToken.bind(this);
    this.handleSubmitComplete = this.handleSubmitComplete.bind(this);
    this.handleCheckComplete = this.handleCheckComplete.bind(this);
    this.handleResultComplete = this.handleResultComplete.bind(this);
  }

  getEndpoint(type, id) {
    const endpointName = type + "Endpoint";
    const apiBase = this.props.apiBase;
    const endpointPart = this.props[endpointName];
    if (!endpointPart) {
      throw Error(`failed to get endpoint for type ${type}`, this.props);
    }
    let endpoint = apiBase ? apiBase + endpointPart : endpointPart;
    if (id) {
      endpoint = endpoint.replace("<id>", id);
    }
    return endpoint;
  }

  handleError(msg) {
    this.setState({ error: true, message: msg });
    if (this.props.onError) {
      this.props.onError(msg);
    }
  }

  handleAuthToken(token) {
    console.log(`handleAuthToken: ${token}`);
    this.setState({ authToken: token, message: "Received Auth Token" });
  }

  renderAuth() {
    const endpoint = this.getEndpoint("authToken");
    console.log("Auth.endpoint", endpoint);
    return (
      <AuthTokenProvider
        endpoint={endpoint}
        username={this.props.username}
        password={this.props.password}
        onError={this.handleError}
        onChange={this.handleAuthToken}
      />
    );
  }

  handleSubmitComplete(submitResponse) {
    console.log("handleSubmitComplete: ", submitResponse);
    const taskId = this.props.taskIdFromSubmit(submitResponse);
    if (!taskId) {
      this.handleError(`Failed to get Task ID from response`);
      return;
    } else {
      this.setState({ taskId, message: "Submitted" });
    }
    if (this.props.onSubmitResponse) {
      this.props.onSubmitResponse(submitResponse);
    }
  }

  renderSubmit() {
    const endpoint = this.getEndpoint("submit");
    const authToken = this.state.authToken;
    const submitData = this.props.submitData;
    return (
      <RemoteDataProvider
        key="remote-data-provider-submit"
        endpoint={endpoint}
        method="POST"
        authToken={authToken}
        data={submitData}
        onError={this.handleError}
        onComplete={this.handleSubmitComplete}
      />
    );
  }

  handleCheckComplete(checkResponse) {
    console.log(`handleCheckComplete: `, checkResponse, this.checkAttempts);
    if (this.props.onCheckResponse) {
      this.props.onCheckResponse(checkResponse);
    }
    const complete = this.props.isCompleteFromCheck(checkResponse);
    if (complete) {
      this.setState({ completed: true, message: "Complete" });
      return;
    }
    this.setState({ message: "Checking..." });
    const maxAttempts = this.props.checkMaxAttempts;
    console.log(`handleCheckComplete`, this.checkAttempts, maxAttempts);
    if (this.checkAttempts++ > maxAttempts) {
      const msg = `Exceeded maximum number of attempts (${maxAttempts}) when checking for results to finish.`;
      return this.handleError(msg, checkResponse);
    }
  }

  renderCheck() {
    const authToken = this.state.authToken;
    const taskId = this.state.taskId;
    const endpoint = this.getEndpoint("check", taskId);
    const interval = this.props.checkInterval;
    return (
      <RemoteDataProvider
        key="remote-data-provider-check"
        authToken={authToken}
        endpoint={endpoint}
        interval={interval}
        onError={this.handleError}
        onComplete={this.handleCheckComplete}
      />
    );
  }

  handleResultComplete(resultResponse) {
    console.log(`handleResultComplete: ${resultResponse}`);
    this.setState({ message: "Success" });
    this.props.onResultResponse(resultResponse);
  }

  renderResult() {
    const authToken = this.state.authToken;
    const taskId = this.state.taskId;
    const endpoint = this.getEndpoint("result", taskId);
    return (
      <RemoteDataProvider
        key="remote-data-provider-result"
        authToken={authToken}
        endpoint={endpoint}
        onError={this.handleError}
        onComplete={this.handleResultComplete}
      />
    );
  }

  renderError() {
    const msg = this.state.message;
    console.error("Error: ", msg, this.state);
    return `Error: ${msg}`;
  }

  render() {
    const { classes } = this.props;
    const error = this.state.error;
    const authToken = this.state.authToken;
    const taskId = this.state.taskId;
    const completed = this.state.completed;
    const message = this.state.message;

    let content = "";
    let progress = <LinearProgress variant="query" />;
    if (error) {
      content = this.renderError();
      progress = (
        <LinearProgress
          variant="determinate"
          value={100}
          classes={{ colorPrimary: red[500] }}
        />
      );
    } else if (!authToken) {
      content = this.renderAuth();
    } else if (!taskId) {
      content = this.renderSubmit();
    } else if (!completed) {
      content = this.renderCheck();
    } else {
      content = this.renderResult();
      progress = null;
    }

    console.log(
      `render: error=${error} authToken=${authToken} taskId=${taskId} completed=${completed}`,
      this.state
    );

    return (
      <div className={classes.root}>
        {message && <Typography>{message}</Typography>}
        {progress}
        {content}
      </div>
    );
  }
}

SubmitCheckResultProvider.propTypes = {
  apiBase: PropTypes.string.isRequired,

  authTokenEndpoint: PropTypes.string.isRequired,
  submitEndpoint: PropTypes.string.isRequired,
  checkEndpoint: PropTypes.string.isRequired,
  resultEndpoint: PropTypes.string.isRequired,
  submitData: PropTypes.object.isRequired,

  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,

  checkInterval: PropTypes.number.isRequired,
  checkMaxAttempts: PropTypes.number.isRequired,
  taskIdFromSubmit: PropTypes.func.isRequired,
  isCompleteFromCheck: PropTypes.func.isRequired,

  onError: PropTypes.func.isRequired,
  onSubmitResponse: PropTypes.func,
  onCheckResponse: PropTypes.func,
  onResultResponse: PropTypes.func.isRequired
};

export default withStyles(styles)(SubmitCheckResultProvider);
