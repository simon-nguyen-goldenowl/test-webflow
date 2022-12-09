let intervalCategory;
let filters = {
  queryString: "all",
  category: {
    text: "All Categories",
    value: "",
  },
  filterOptions: [],
};
let prevFilter = {
  queryString: "all",
  category: {
    text: "All Categories",
    value: "",
  },
  filterOptions: [],
};

let currentPage = 0;
let totalPage = 1;
let isFetching = false;

function handleFilter(ele) {
  const value = ele.attr("filter-value");
  Object.assign(prevFilter.category, filters.category);
  prevFilter.filterOptions = filters.filterOptions.slice(0);
  currentPage = 0;
  totalPage = 1;

  if (filters.filterOptions.includes(value)) {
    const index = filters.filterOptions.indexOf(value);
    filters.filterOptions.splice(index, 1);
  } else {
    filters.filterOptions.push(value);
  }
  getShopSearchList();
}

function toggleCategoryList(isOpen = true) {
  return $(".category-list__wrapper").css("display", isOpen ? "block" : "none");
}

function changeCategory(item) {
  let chosenCate = item.find(".category-item-title");
  if (chosenCate.attr("search-value") == filters.category.value)
    return toggleCategoryList(false);
  Object.assign(prevFilter.category, filters.category);
  prevFilter.filterOptions = filters.filterOptions;
  currentPage = 0;
  totalPage = 1;

  filters.category.text = chosenCate.text();
  filters.category.value = chosenCate.attr("search-value");
  getShopSearchList();
  if (window.innerWidth > 767) toggleCategoryList(false);
}

function rollBackFilter() {
  Object.assign(filters.category, prevFilter.category);
  filters.filterOptions = prevFilter.filterOptions.slice(0);
  currentPage = 0;
  totalPage = 1;

  getShopSearchList();
}

function generateFilter() {
  let filterStr = `searchableLocations:${Cookies.get(
    "country"
  )} AND isSearchable:true`;
  if (filters.category.value)
    filterStr += ` AND categories:"${filters.category.value}"`;
  filters.filterOptions.forEach((option) => {
    filterStr += ` AND ${option}`;
  });
  return filterStr;
}

function displayFilters() {
  updateQueryString();
  $(".chosen-category-item__title").text(filters.category.text);
  $(".filter-item").each(function () {
    filters.filterOptions.includes($(this).attr("filter-value"))
      ? $(this).addClass("chosen-item")
      : $(this).removeClass("chosen-item");
  });

  if (window.innerWidth <= 767) {
    let chosen = filters.category.value;
    $(".category-item-title").each(function () {
      let color =
        !chosen || $(this).attr("search-value") == chosen
          ? "#262324"
          : "#DFD7CD";
      $(this).css("color", color);
    });
  }
}

function getShopSearchList() {
  const container = $(".shop-search-body__container");
  if (currentPage == 0) container.html("");

  isFetching = true;
  const spinner = document.querySelector(".shop-search-body .progress-spinner");
  toggleSpinner(spinner, isFetching);
  displayFilters();
  let filterStr = generateFilter();
  index
    .search(filters.queryString, {
      filters: filterStr,
      hitsPerPage: 18,
      page: currentPage,
    })
    .then(({ hits, nbHits, nbPages, page }) => {
      isFetching = false;
      toggleSpinner(spinner, isFetching);

      $(".category-total-count").text(`${nbHits} stores found`);
      currentPage = page;
      totalPage = nbPages;

      if (hits.length <= 0) {
        $(".load-more-action").hide();
        return $(".shop-search-no-result").css("display", "flex");
      }

      $(".shop-search-no-result").css("display", "none");
      renderStoreList(hits, container[0]);

      //load more flag
      if (currentPage < totalPage - 1)
        container.append('<div class="add-more-indicator">');

      const canLoadMore = $(".add-more-indicator");
      const loadMoreAction = $(".load-more-action");
      if (!canLoadMore.length) return loadMoreAction.hide();

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (currentPage < totalPage - 1 && !isFetching) {
            currentPage++;
            loadMoreAction.css("display", currentPage >= 2 ? "flex" : "none");
            if (currentPage < 2) setTimeout(getShopSearchList, 500);
          }
          $(entry.target).remove();
        });
      });
      if (canLoadMore[0]) observer.observe(canLoadMore[0]);
    });
}

function updateQueryString() {
  const url = new URL(window.location);
  const params = url.searchParams;
  params.set("filterBy", filters.queryString);
  params.set("category", filters.category.text);

  const options = filters.filterOptions;
  let shopType = "";
  if (options.includes("isOnlineStore:true")) shopType = "online,";
  if (options.includes("isPhysicalStore:true")) shopType += "inStore";
  shopType.length
    ? params.set("shopType", shopType)
    : params.delete("shopType");

  let tags = "";
  if (options.includes("isPaceCard:true")) tags = "paceCard";
  if (options.includes("tags:PayN3"))
    tags += tags.length ? ",payIn3" : "payIn3";
  if (options.includes("tags:Affiliate"))
    tags += tags.length ? ",deals" : "deals";
  tags.length ? params.set("tags", tags) : params.delete("tags");
  window.history.pushState({}, "", url);
}

function processUrlParams() {
  const url = new URL(window.location);
  const params = url.searchParams;

  if (params.has("filterBy")) filters.queryString = params.get("filterBy");

  if (params.has("category")) {
    filters.category.text = params.get("category");
    $(".chosen-category-item__title").text(
      params.get("category") == "all"
        ? "All Categories"
        : params.get("category")
    );
  }

  if (params.has("shopType")) {
    const types = params.get("shopType").split(",");
    if (types.includes("online")) {
      filters.filterOptions.push("isOnlineStore:true");
      $('[filter-value="isOnlineStore:true"]').addClass("chosen-item");
    }
    if (types.includes("inStore")) {
      filters.filterOptions.push("isPhysicalStore:true");
      $('[filter-value="isPhysicalStore:true"]').addClass("chosen-item");
    }
  }

  if (params.has("tags")) {
    const tags = params.get("tags").split(",");
    if (tags.includes("paceCard")) {
      filters.filterOptions.push("isPaceCard:true");
      $('[filter-value="isPaceCard:true"]').addClass("chosen-item");
    }

    if (tags.includes("payIn3")) {
      filters.filterOptions.push("tags:PayN3");
      $('[filter-value="tags:PayN3"]').addClass("chosen-item");
    }

    if (tags.includes("deals")) {
      filters.filterOptions.push("tags:Affiliate");
      $('[filter-value="tags:Affiliate"]').addClass("chosen-item");
    }
  }
}

function addCustomEvents() {
  $(".load-more-button").click(getShopSearchList);
  $(".back-button").click(rollBackFilter);
  $(".filter-item").click(function () {
    handleFilter($(this));
  });
  $(document).click(function (event) {
    if (!$(".category-list-container")[0].contains(event.target))
      toggleCategoryList(false);
  });
  $(".category-item").click(function (e) {
    e.stopPropagation();
    changeCategory($(this));
  });
}

addCustomEvents();
processUrlParams();
getShopSearchList();
