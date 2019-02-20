const puppeteer = require("puppeteer");
const program = require("commander");
const selectors = require("./selectors");

program
  .version("0.0.0", "-v, --version")
  .description("Get users who liked post")
  .option("-h, --headed", "[Disable headless mode]")
  .parse(process.argv);

if (program.headed) console.log("|Headless mode disabled|");
else {
  program.headed = false;
  console.log("|Headless mode activated|");
}

class getUsersFromPost {
  constructor() {
    this.page = null;
    this.login = "YOUR_LOGIN";
    this.password = "YOUR_PASS";
    this.setUsers = new Set();
  }

  async init() {
    try {
      await this.runBrowser();

      await this.openPage();
      await this.igLogin();
      await this.getImg();
      await this.getResponse();
      await this.scrollPage();
    } catch (err) {
      throw new Error(err);
    }
  }

  async runBrowser() {
    const randWindowSizeW = parseInt(Math.random() * 80 + 1200, 10);
    const randWindowSizeH = parseInt(Math.random() * 80 + 800, 10);
    const options = {
      ignoreHTTPSErrors: false,
      headless: !program.headed,
      args: [
        "--no-sandbox",
        `--window-size=${randWindowSizeW},${randWindowSizeH}`,
        "--proxy-server = 113.11.156.42:44862"
      ]
    };

    console.log(options.args);
    this.browser = await puppeteer.launch(options).catch(async err => {
      Promise.reject(new Error(err));
    });
  }

  async openPage() {
    try {
      const pages = await this.browser.pages();
      this.page = await pages[0];
      // await this.page.setRequestInterception(true);
      // this.page.on("request", request => {
      //   if (request.resourceType() === "image") request.abort();
      //   else request.continue();
      // });
      await this.page.goto("https://www.instagram.com/accounts/login/");
    } catch (err) {
      throw new Error(err);
    }
    console.log("Link true!");
  }

  async igLogin() {
    try {
      await this.page.waitForSelector("input");
      await this.page.focus("input");
      await this.page.keyboard.type(this.login);
      await this.page.keyboard.press("Tab");
      await this.page.keyboard.type(this.password);
      await this.page.keyboard.press("Enter");
      await this.page.waitFor(4000);
      await this.page.goto("https://www.instagram.com/kherson_nobloodtattoo/", {waitUntil: 'networkidle2'});
      await this.page.waitFor(2000);
    } catch (err) {
      throw new Error(err);
    }
    console.log("Logged successfully!");
  }

  async getImg() {
    try {
      console.log("Photo get!");
      await this.page.$(selectors.IMG);
      await this.page.click(selectors.IMG);
      await this.page.waitForSelector(selectors.BTN_LIKES_ON_PHOTO);
      await this.page.click(selectors.BTN_LIKES_ON_PHOTO);
      await this.page.waitFor(3000);
    } catch (err) {
      throw new Error(err);
    }
  }

  async getResponse() {
    await this.page.on("response", async response => {

      try {
        await this.page.waitFor(3000);
        const status = await response.status();
        const url = await response.url();

        if (
          (await url.includes("graphql")) &&
          (await status) === 200 &&
          (await response.request().resourceType()) === "xhr"

        ) {
          const body = await response.text();

          if (body) {
            const json = await JSON.parse(body);

            if (json.data.shortcode_media.edge_liked_by) {
              const likes = json.data.shortcode_media.edge_liked_by.edges;
              await likes.forEach(_node => {
                const { node } = _node;
                this.setUsers.add({
                  username: node.username
                });
              });

              console.log(this.setUsers.size);
              console.log(this.setUsers);
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  }

  async scrollPage() {
    await this.page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalH = 0;
        let distance = 50;
        let timer = setInterval(() => {
          let scrollHeight = document.querySelector(".i0EQd > div:nth-child(1)")
            .scrollHeight;
          document
            .querySelector(".i0EQd > div:nth-child(1)")
            .scrollBy(0, distance);
          totalH += distance;
          if (totalH >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 1000);
      });
    });
    console.log(`Collected ${this.setUsers.size} users from post`);

    for (let val of this.setUsers) {
      console.log(val);
    }
  }
} //END OF CLASS

getUsersFromPost = new getUsersFromPost();
getUsersFromPost.init().catch(err => console.log(err));
