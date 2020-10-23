function timeago(time, idx){
    let timeTable = [
        ['just now', 'just now'],
        [' seconds ago', ' secs'],
        [' minute ago', ' min'],
        [' minutes ago', ' mins'],
        [' hour ago', ' hr'],
        [' hours ago', ' hrs'],
        [' day ago', ' day'],
        [' days ago', ' days'],
        [' week ago', ' wk'],
        [' weeks ago', ' wks'],
        [' month ago', ' mth'],
        [' months ago', ' mths'],
        [' year ago', ' yr'],
        [' years ago', ' yrs']
    ]
    let t = {
        min: 60,
        hour: 3600,
        day: 24 * 3600,
        week: 7 * 24 * 3600,
        year: 365 * 24 * 3600
    }
    let now = new Date();
    let ago = new Date(time)
    let connect = (diff, i) =>(diff + timeTable[i][idx]);
    let diff = Math.floor(Date.now()/1000) - Math.floor(time/1000);
    if(diff < 30){
        return connect('',0);
    }
    else if(diff < 60){
        return connect(diff, 1);
    }
    else if(diff < 120){
        return connect(1, 2);
    }
    else if(diff < 3600){
        return connect(Math.floor(diff/t.min), 3);
    }
    else if(diff < 2 * t.hour){
        return connect(1, 4);
    }
    else if(diff < t.day){
        return connect(Math.floor(diff/t.hour), 5);
    }
    else if(diff < 2 * t.day){
        return connect(1, 6);
    }
    else if(diff < t.week){
        return connect(Math.floor(diff/t.day), 7);
    }
    else if(diff < 2 * t.week){
        return connect(1, 8)
    }
    else if(diff < 4 * t.week){
        return connect(Math.floor(diff/t.week), 9)
    }
    else if(diff <= 31 * t.day){
        if(now.getMonth() !== ago.getMonth && now.getDate() > ago.getDate()){
            return connect(1, 10);
        }
        else{
            return connect(Math.floor(diff/t.week), 9);
        }
    }
    else if(diff <= 365 * t.day){
        let m;
        if(now.getFullYear() === ago.getFullYear()){
            if(now.getDate() >= ago.getDate()){
                return connect((m = now.getMonth() - ago.getMonth()), m > 1 ? 11: 10)
            }
            else{
                return connect((m = now.getMonth() - ago.getMonth() - 1), m > 1 ? 11: 10)
            }
        }
        else{
            if(now.getDate() >= ago.getDate()){
                return connect((m = (now.getMonth()) + (12 - ago.getMonth())), m > 1 ? 11: 10);
            }
            else{
                return connect((m = (now.getMonth() - 1) + (12 - ago.getMonth())), m > 1 ? 11: 10);
            }
        }
    }
    else if(diff < 2 * t.year){
        return connect(1, 12);
    }
    else{
        let y = Math.floor(diff/t.year);
        return connect(y, y === 1 ? 12 : 13);
    }
}
export default timeago;