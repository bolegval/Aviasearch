"use strict";

const formSearch = document.querySelector(".form-search"),
  inputCitiesFrom = document.querySelector(".input__cities-from"),
  dropDownCitiesFrom = document.querySelector(".dropdown__cities-from"),
  inputCitiesTo = document.querySelector(".input__cities-to"),
  dropDownCitiesTo = document.querySelector(".dropdown__cities-to"),
  inputDateDepart = document.querySelector(".input__date-depart"),
  cheapestTicket = document.getElementById("cheapest-ticket"),
  otherCheapTickets = document.getElementById("other-cheap-tickets");

///API данные
const citiesApi = "dataBase/dataCities.json",
  proxy = "https://cors-anywhere.herokuapp.com/",
  API_KEY = "1511b97bfc6ea37d66aa0d304f088771",
  calendarApi = "http://min-prices.aviasales.ru/calendar_preload",
  MAX_COUNT = 10;

let city = [];

//Функции

const getData = (url, callback, reject = console.error()) => {
  const request = new XMLHttpRequest();

  request.open("GET", url);

  request.addEventListener("readystatechange", () => {
    if (request.readyState !== 4) return;

    if (request.status === 200) {
      callback(request.response);
    } /* else {
      reject(request.status);
    } */
  });

  request.send();
};

const renderCityList = (city) => {
  city.sort((a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
};

const showCity = (input, list) => {
  list.textContent = "";

  if (input.value !== "") {
    const filterCity = city.filter((item) => {
      if (item.name) {
        const fixItem = item.name.toLowerCase();
        return fixItem.startsWith(input.value.toLowerCase());
      }
    });

    renderCityList(filterCity);

    filterCity.forEach((item) => {
      const li = document.createElement("li");
      li.classList.add("dropdown__city");
      li.textContent = item.name;
      list.append(li);
    });
  }
};

const inputCity = (ev, input, list) => {
  if (ev.target.tagName.toLowerCase() === "li") {
    input.value = ev.target.textContent;
    list.textContent = "";
  }
};

const getNameCity = (code) => {
  const objCity = city.find((item) => item.code === code);
  return objCity.name;
};

const getDate = (date) => {
  return new Date(date).toLocaleString("ru", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getChanges = (num) => {
  if (num) {
    return num === 1 ? "С одной пересадкой" : "С двумя пересадками";
  } else {
    return "Без пересадок";
  }
};

const getLink = (data) => {
  let link = "https://www.aviasales.ru/search/";
  link += data.origin;

  const date = new Date(data.depart_date);
  const day = date.getDate();
  const month = date.getMonth();

  link += day < 10 ? "0" + day : day;
  link += month < 10 ? "0" + month : month;
  link += data.destination;
  link += "1";

  return link;
};

const createCardCheapest = (data) => {
  const ticket = document.createElement("article");
  ticket.classList.add("ticket");

  let deep = "";
  if (data) {
    deep = `
      <h3 class="agent">${data.gate}</h3>
        <div class="ticket__wrapper">
          <div class="left-side">
            <a href="${getLink(
              data
            )}" target="_blank" class="button button__buy">Купить
              за ${data.value}₽</a>
          </div>
          <div class="right-side">
            <div class="block-left">
              <div class="city__from">Вылет из города:
                <span class="city__name">${getNameCity(data.origin)}</span>
              </div>
              <div class="date">${getDate(data.depart_date)}</div>
            </div>

            <div class="block-right">
              <div class="changes">${getChanges(data.namber_of_changes)}</div>
              <div class="city__to">Город назначения:
                <span class="city__name">${getNameCity(data.destination)}</span>
              </div>
            </div>
          </div>
        </div>
    `;
  } else {
    deep = "<h3>На эту дату билетов нет</h3>";
  }

  ticket.insertAdjacentHTML("afterbegin", deep);
  return ticket;
};

const renderCheapDay = (cheapTicketDay) => {
  cheapestTicket.style.display = "block";
  cheapestTicket.innerHTML = "<h2>Самый дешевый билет на выбранную дату</h2>";

  const ticket = createCardCheapest(cheapTicketDay[0]);
  cheapestTicket.append(ticket);
};

const renderCheapAll = (cheapTicket) => {
  otherCheapTickets.style.display = "block";
  otherCheapTickets.innerHTML = "<h2>Самые дешевые билеты на другие даты</h2>";
  cheapTicket.sort((a, b) => a.value - b.value);

  for (let i = 0; i < cheapTicket.length && i < MAX_COUNT; i++) {
    const ticket = createCardCheapest(cheapTicket[i]);
    otherCheapTickets.append(ticket);
  }
};

const renderCheap = (data, dateData) => {
  const cheapTicket = JSON.parse(data).best_prices;
  const cheapTicketDay = cheapTicket.filter(
    (item) => item.depart_date === dateData
  );

  renderCheapDay(cheapTicketDay);
  renderCheapAll(cheapTicket);
};

//Обработчики
inputCitiesFrom.addEventListener("input", () => {
  showCity(inputCitiesFrom, dropDownCitiesFrom);
});

dropDownCitiesFrom.addEventListener("click", (ev) => {
  inputCity(ev, inputCitiesFrom, dropDownCitiesFrom);
});

inputCitiesTo.addEventListener("input", () => {
  showCity(inputCitiesTo, dropDownCitiesTo);
});

dropDownCitiesTo.addEventListener("click", (ev) => {
  inputCity(ev, inputCitiesTo, dropDownCitiesTo);
});

formSearch.addEventListener("submit", (ev) => {
  ev.preventDefault();

  const formData = {
    from: city.find((item) => inputCitiesFrom.value === item.name),
    to: city.find((item) => inputCitiesTo.value === item.name),
    when: inputDateDepart.value,
  };

  if (formData.from && formData.to) {
    const requestString = `?depart_date=${formData.when}&origin=${formData.from.code}&destination=${formData.to.code}&one_way=true&token=${API_KEY}`;

    getData(
      calendarApi + requestString,
      (response) => {
        renderCheap(response, formData.when);
      },
      (error) => {
        alert("В этом направлении нет рейсов");
        console.log("Ошибка" + error);
      }
    );
  } else {
    alert("Введите название города"); // Заменить модалкой или выводом сообщения  на страницу
  }
});

getData(citiesApi, (data) => {
  city = JSON.parse(data);
});

//при клике вне списка города, список скрывается
