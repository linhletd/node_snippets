import React from 'react';
class WeatherApp extends React.PureComponent{
    ref = React.createRef();
    state = {
        weather: {},
        input: '',
        showInput: true
    }
    handleInputChange = (e) =>{
        let input = e.target;
        this.checkAndSetState({input: input.value});
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
            if(data.err) throw new Error(data.err);
            return {
                location: data.city ? data.city.split(/\s\//)[0] + ", " + data.name + ", " + data.sys.country : data.name + ", " + data.sys.country,
                name: data.name,
                description: data.weather[0].main + ", " + data.weather[0].description,
                temp: data.main.temp,
                visibility: (data.visibility/1000).toFixed(0),
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
        e && e.preventDefault();
        if(!this.state.showInput){
            this.checkAndSetState({
                showInput: true,
            },()=>{document.getElementById('search_bar').querySelector('input').focus();})
        }
        else if(this.state.input){
            this.fetchData({q: this.state.input})
            .then((data) => {
                this.checkAndSetState({weather: data, input: '', showInput: false})
            })
        }
    }
    handleClickGetGeo = (e) =>{
        e.preventDefault();
        this.getDataByLatLon().then((data) => {
            this.checkAndSetState({weather: data, showInput: false})
        })
    }
    checkAndSetState = (state) =>{
        if(this.ref.current){
            this.setState(state);
        }
    }
    componentDidMount(){
        this.fetchData({q: 'hanoi'})
        .then((data) => {
            this.checkAndSetState({weather: data, showInput: false})
        });
        this.itv = setInterval(() =>{
            if(this.state.weather.name){
                this.fetchData({q: this.state.weather.name})        
                .then((data) => {
                    this.checkAndSetState({weather: data, showInput: false})
                });;
            }
        }, 3600 * 1000 * 2);
    }
    componentWillUnmount(){
        clearInterval(this.itv);
    }
    render(){
        let {weather, input} = this.state;
        if(weather.err){
            this.state.showInput = true;
        }
        let searchBar = <div id = "search_bar">
                            {this.state.showInput ? <input value = {input} placeholder = 'e.g: thai nguyen' onKeyDown = {this.handleInputEnter} onChange = {this.handleInputChange}/> : ''}
                            <button onClick = {this.handleClickFind}><i className="fa fa-search"></i></button>
                            <button onClick = {this.handleClickGetGeo} ><i className="fa fa-map-marker"></i></button>
                        </div>
        let location = weather.location ? <p>{weather.location}</p> : ''
        let WeatherInfo = !weather.name && !weather.err ? '' : weather.err ? <div id = "weather_show" style = {{color: '#ff3333'}}>{weather.err}</div> :
                    <div id = "weather_show">
                        <div id = 'info'>
                            <div id = 'weather_main'>
                                <p>{weather.description}</p>
                                <div>
                                    <img src = {"http://openweathermap.org/img/wn/"+weather.icon+"@2x.png"}></img>
                                    <span style = {{fontSize: '17px'}}>{weather.temp} &#8451;</span>
                                </div>
                            </div>
                            <div id = 'weather_sub'>
                                <div><i className="fa fa-eye" style = {{color: '#008000'}}/><span>{weather.visibility + 'km'}</span></div>
                                <div><i className="fa fa-tint" style = {{color: '#3366cc'}}/><span>{weather.humidity + '%'}</span></div>
                                <div><i className="fa fa-sun-o" style = {{color: '#ff6600'}}/><span>{weather.sunrise}</span></div>
                                <div><i className="fa fa-moon-o" style = {{color: '#669999'}}/><span>{weather.sunset}</span></div>
                            </div>
                        </div>
                    </div>
        return (
            <div id = 'weather_app' ref = {this.ref}>
                <div className = {this.state.showInput ? 'col' : 'r_row'}>
                    {searchBar}
                    {location}
                </div>
                {WeatherInfo}
            </div>
        )
    }
}
export default WeatherApp;