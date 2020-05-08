/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    const docsUrl = this.props.config.docsUrl;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ""}`;
    const langPart = `${language ? `${language}/` : ""}`;
    return `${baseUrl}${docsPart}${langPart}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : "") + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="52"
                height="52"
              />
            )}
          </a>
          {this.props.config.theodoLogo && (
            <a href="https://www.theodo.co.uk">
              <img
                src={this.props.config.baseUrl + this.props.config.theodoLogo}
                alt={"Theodo"}
                width="52"
                height="52"
                style={{ paddingRight: "30px" }}
              />
            </a>
          )}
          <div>
            <h5>Docs</h5>
            <a href={this.docUrl("README.html", this.props.language)}>
              Installation and use
            </a>
            <a href={this.docUrl("pricing.html", this.props.language)}>
              AWS pricing
            </a>
          </div>
          <div>
            <h5>Community</h5>
            <a
              href={"https://twitter.com/SlsDevTools"}
              className="twitter-follow-button"
            >
              Follow @SlsDevTools
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href="https://medium.com/serverless-transformation">Blog</a>
            <a href="https://github.com/Theodo-UK/sls-dev-tools">GitHub</a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/facebook/docusaurus/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub"
            >
              Star
            </a>
          </div>
        </section>
      </footer>
    );
  }
}

module.exports = Footer;
