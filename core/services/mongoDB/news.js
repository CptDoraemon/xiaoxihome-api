const API_KEY_COMPONENT = `&apiKey=${process.env.NEWS_API_KEY}`;
const BASE_URL = `https://newsapi.org/v2/top-headlines?country=ca`;
const CATEGORY_BASE = `&category=`;

const HEAD_LINE_URL = BASE_URL + API_KEY_COMPONENT;
const CATEGORIES = [`headline`, `business`, `entertainment`, `health`, `science`, `sports`, `technology`];
const CATEGORIES_URLS = CATEGORIES.map(_ => BASE_URL + CATEGORY_BASE + _ + API_KEY_COMPONENT);

class NewsService {
  db = null;
  latestNews = {};
  collections = {
    'lastUpdatedNews': null,
    'news': null
  }

  constructor(db) {
    this.db = db;
    this.collections = {
      'lastUpdatedNews': this.db.collection('lastUpdatedNews'),
      'news': this.db.collection('news'),
    }
  }

  getLastUpdated() {

  }

  updateLatestAll() {

  }

  async updateLatestInCategory() {
    try {
      // get cache from db on server start
      if (!Object.keys(this.latestNews).length) {
        const cache = await getNewsCacheFromDB(currentNewsCollection);
        CACHE = Object.assign({}, cache);
        DELAY = 1000 * 60 * 5; // Start to call api after 5 minutes
      }

      // get latest news from newsapi.org
      let i = 0;
      const getNewsInQueue = () => {
        const isLast = i === CATEGORIES.length - 1;
        getNews(CATEGORIES_URLS[i], CATEGORIES[i], isLast, currentNewsCollection);
        i++;
        if (!isLast) {
          setTimeout(getNewsInQueue, CATEGORY_REQUEST_INTERVAL);
        } else {
          SCHEDULED_UPDATE_TIMER = setTimeout(() => getAllNews(currentNewsCollection), UPDATE_INTERVAL);
        }
      };

      setTimeout(() => getNews(HEAD_LINE_URL, 'headline', false), DELAY);
      setTimeout(getNewsInQueue, DELAY + CATEGORY_REQUEST_INTERVAL);
    } catch (e) {
      console.log(e);
    }
  }
}
