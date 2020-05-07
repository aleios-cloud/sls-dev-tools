/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");

// const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const { siteConfig, language = "" } = this.props;
    const { baseUrl, docsUrl } = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ""}`;
    const langPart = `${language ? `${language}/` : ""}`;
    const docUrl = (doc) => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = (props) => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const Logo = (props) => "";

    const ProjectTitle = () => (
      <h2 className="projectTitle">
        {siteConfig.title}
        <small>{siteConfig.tagline}</small>
      </h2>
    );

    const PromoSection = (props) => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = (props) => (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={props.href} target={props.target}>
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        <Logo img_src={`${baseUrl}img/undraw_monitor.svg`} />
        <div className="inner">
          <ProjectTitle siteConfig={siteConfig} />
          <PromoSection>
            <Button href="https://github.com/Theodo-UK/sls-dev-tools">
              Try It Out
            </Button>
            <Button href={docUrl("README.html")}>Documentation</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

class Index extends React.Component {
  render() {
    const { config: siteConfig, language = "" } = this.props;
    const { baseUrl } = siteConfig;

    const Block = (props) => (
      <Container
        padding={["bottom", "top"]}
        id={props.id}
        background={props.background}
      >
        <GridBlock
          align={props.align ? props.align : "center"}
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const FeatureCallout = () => (
      <div
        className="productShowcaseSection paddingBottom"
        style={{ textAlign: "center" }}
      >
        <h2>All your serverless statistics, right in your terminal!</h2>
        <p>Log your lambdas without logging onto AWS.</p>
        <p>Deploy lambdas in a single keypress</p>
        <p>View all your event buses, and inject events</p>
        <p>
          Integration with{" "}
          <a href="https://aws.amazon.com/eventbridge/">AWS EventBridge</a> and
          the{" "}
          <a href="https://docs.aws.amazon.com/eventbridge/latest/userguide/eventbridge-schemas.html">
            EventBridge Schema Registry
          </a>
          .
        </p>
        <img
          width="50%"
          src={`${baseUrl}img/demo.png`}
          alt="Serverless Dev Tool UI"
        />
      </div>
    );

    const TryOut = () => (
      <Block align="left" id="try">
        {[
          {
            content: `<ul>
                <li>Invocations</li>
                <li>Errors</li>
                <li>Recent durations</li>
                <li>Logs</li>
              </ul>`,
            image: `${baseUrl}img/undraw_predictive_analytics.svg`,
            imageAlt: "sls-dev-tools analytics",
            imageAlign: "left",
            title: "Visibility on",
          },
        ]}
      </Block>
    );

    const Description = () => (
      <Block align="left" background="dark">
        {[
          {
            content:
              "Serverless-Dev-Tools is an open source tool. We need help improving it. Issues, PRs, Ideas and Feedback are all welcome!",
            image: `${baseUrl}img/undraw_pair_programming_njlp.svg`,
            imageAlt: "Contribute to this open sls-dev-tools!",
            imageAlign: "right",
            title: "We need you!",
          },
        ]}
      </Block>
    );

    const LearnHow = () => (
      <Block align="left" background="dark">
        {[
          {
            content: `Serverless-Dev-Tools provides a quick overview of your stack as you code, providing feedback and visibility without the need to log into the AWS Console and load the right metrics.
              This is not a logging platform, alerting system or online dashboard. It\'s a developer tool in the terminal to keep you connected to key metrics as you code.`,
            image: `${baseUrl}img/undraw_programmer_imem.svg`,
            imageAlt: "sls-dev-tools gives you fast feedback while you develop",
            imageAlign: "right",
            title:
              "Backend development shouldn't need a browser in the dev feedback loop",
          },
        ]}
      </Block>
    );

    const Features = () => (
      <Block layout="fourColumn">
        {[
          {
            image: `${baseUrl}img/undraw_programmer_imem.svg`,
            imageAlt: "Serverless Devlopement",
            imageAlign: "bottom",
            title: "In-Terminal Feedback",
          },
          {
            image: `${baseUrl}img/undraw_predictive_analytics.svg`,
            imageAlt: "Easy to use tool",
            imageAlign: "bottom",
            title: "Simple Visibility",
          },
          {
            image: `${baseUrl}img/undraw_dashboard.svg`,
            imageAlt: "Serverless analysis",
            imageAlign: "bottom",
            title: "Targeted Metrics",
          },
        ]}
      </Block>
    );

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter((user) => user.pinned)
        .map((user) => (
          <a href={user.infoLink} key={user.infoLink}>
            <img src={user.image} alt={user.caption} title={user.caption} />
          </a>
        ));

      const pageUrl = (page) =>
        baseUrl + (language ? `${language}/` : "") + page;

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Who is Using This?</h2>
          <p>This project is used by all these people</p>
          <div className="logos">{showcase}</div>
          <div className="more-users">
            <a className="button" href={pageUrl("users.html")}>
              More {siteConfig.title} Users
            </a>
          </div>
        </div>
      );
    };

    const Video = (props) => (
      <div className="videoWrapper" style={{ textAlign: "center" }}>
        <video width={props.width} height={props.height} controls>
          <source src={props.source} type="video/mp4" />
        </video>
      </div>
    );

    return (
      <div>
        <HomeSplash siteConfig={siteConfig} language={language} />
        <div className="mainContainer">
          <Video width={720} height={405} source={`${baseUrl}img/demo.mp4`} />
          <Features />
          <FeatureCallout />
          <LearnHow />
          <TryOut />
          <Description />
          <Showcase />
        </div>
      </div>
    );
  }
}

module.exports = Index;
