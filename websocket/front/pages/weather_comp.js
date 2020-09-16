import React from 'react';
class WeatherApp extends React.PureComponent{
    state = {
        weather: {},
        input: '',
    }
    handleInputChange = (e) =>{
        let input = e.target;
        this.setState({input: input.value});
    }
    handleInputEnter = (e) =>{
        let input = e.target;
        if(e.keyCode === 13){
            e.preventDefault();
            input.blur();
            this.handleClickFind();
        }
    }
    fetchData(option){
        return fetch('/others/currentweather',{
            method: 'POST',
            headers:{'Content-Type': 'application/json'},
            cache: 'no-cache',
            body: JSON.stringify(option)
        })
        .then(res => {
            if(res.redirected){
                throw new Error('please login again');
            }
            return res.json()
        })
        .then(data =>{
            return {
                location: data.city ? data.city.split(/\s\//)[0] + ", " + data.name + ", " + data.sys.country : data.name + ", " + data.sys.country,
                name: data.name,
                description: data.weather[0].main + ", " + data.weather[0].description,
                temp: data.main.temp,
                visibility: (data.visibility/1000).toFixed(1),
                sunrise: new Date(data.sys.sunrise * 1000).toTimeString().slice(0,5),
                sunset: new Date(data.sys.sunset * 1000).toTimeString().slice(0,5),
                humidity: data.main.humidity,
                icon: data.weather[0].icon
            }
        })
        .catch((err) =>({err: err.message || 'error'}));
    }
    getDataByLatLon = async () =>{
        var position = await new Promise((resolve, reject) => {navigator.geolocation.getCurrentPosition(resolve, reject)});
        if(position){
            var pos = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            }; 
            let res = await this.fetchData(pos);
            return res;
        }
        else{
            return Promise.resolve({err: 'Position access denied, please change setting'});
        }
    }
    handleClickFind = (e) =>{
        e.preventDefault();
        console.log('find')
        if(this.state.input){
            this.fetchData({q: this.state.input})
            .then((data) => {
                this.setState({weather: data, input: ''})
            })
        }
    }
    handleClickGetGeo = (e) =>{
        console.log('get goe')
        e.preventDefault();
        this.getDataByLatLon().then((data) => {
            this.setState({weather: data})
        })
    }
    componentDidMount(){
        this.fetchData({q: 'hanoi'})
        .then((data) => {
            this.setState({weather: data})
        });
        this.itv = setInterval(() =>{
            if(this.state.weather.name){
                this.fetchData({q: this.state.weather.name})        
                .then((data) => {
                    this.setState({weather: data})
                });;
            }
        }, 3600 * 1000 * 2);
    }
    componentWillUnmount(){
        clearInterval(this.itv);
    }
    render(){
        let {weather, input} = this.state;
        console.log(weather)
        let searchBar = <div id = "search-bar">
                            <input value = {input} placeholder = 'e.g: thai nguyen' onKeyDown = {this.handleInputEnter} onChange = {this.handleInputChange}></input>
                            <button onClick = {this.handleClickFind} ><i className="fa fa-search"></i></button>
                            <button onClick = {this.handleClickGetGeo} ><i className="fa fa-map-marker"></i></button>
                        </div>
        let WeatherInfo = !weather.name && !weather.err ? '' : weather.err ? <div id = "weather-show" style = {{color: 'red'}}>{weather.err}</div> :
                    <div id = "weather-show">
                        <p>{weather.location}</p>
                        <div>
                            <img src = {"http://openweathermap.org/img/wn/"+weather.icon+"@2x.png"}></img>
                            <span style = {{fontSize: '20px'}}>{weather.temp} &#8451;</span>
                            <p>{weather.description}</p>
                        </div>
                        <div>
                            <div><i className="fa fa-eye"/><span>{weather.visibility + 'km'}</span></div>
                            <div><i className="fa fa-tint"/><span>{weather.humidity + '%'}</span></div>
                            <div><i className="fa fa-sun-o"/><span>{weather.sunrise}</span></div>
                            <div><i className="fa fa-moon-o"/><span>{weather.sunset}</span></div>
                        </div>
                    </div>
        return (
            <div id = 'weather_app'>
                {searchBar}
                {WeatherInfo}
            </div>
        )
    }
}
export default WeatherApp;