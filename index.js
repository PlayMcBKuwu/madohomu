
//var madohomu_root = ''
//madohomu_root = 'https://ipv6.haojiezhe12345.top:82/madohomu/'

var newLoadCommentMode = true

function loadComments(from, count, time) {
    //if (from == null && time == null) setTodayCommentCount()

    const xhr = new XMLHttpRequest();

    if (from == null && count == null && time == null) {
        xhr.open("GET", "https://haojiezhe12345.top:82/madohomu/api/comments");
    }
    if (from != null && count == null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?from=${from}`);
    }
    if (from == null && count != null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?count=${count}`);
    }
    if (from != null && count != null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?from=${from}&count=${count}`);
    }
    if (from == null && count == null && time != null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?time=${time}`);
    }

    xhr.send();
    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            //console.log(xhr.response);

            if (xhr.response[0].time > maxCommentTime) {
                maxCommentTime = xhr.response[0].time
                loadTimeline(maxCommentTime)
                setTodayCommentCount()
            }

            var xhrMaxCommentID = null
            var xhrMinCommentID = null
            //var prevLatestCommentEl = document.getElementById('topComment') ? document.getElementById('topComment').nextElementSibling : commentDiv.firstElementChild
            var prevLatestCommentEl = document.getElementById('loadingIndicatorBefore').nextElementSibling
            var prevCommentTop = prevLatestCommentEl.getBoundingClientRect().top
            var prevCommentLeft = prevLatestCommentEl.getBoundingClientRect().left

            for (var comment of xhr.response) {
                if (!newLoadCommentMode && false) {
                    //console.log(comment)

                    if (comment.id >= minCommentID && minCommentID != null) {
                        //console.log('skipping load of comment ID ' + comment.id)
                        continue
                    }
                    if (comment.hidden == 1 && !document.getElementById('showHidden').checked) {
                        console.log('skipping hidden comment #' + comment.id + ' ' + comment.comment)
                        continue
                    }

                    var time = new Date(comment.time * 1000)
                    date = time.toLocaleDateString()
                    hour = time.toLocaleTimeString()

                    var randBG
                    while (true) {
                        randBG = getRandomIntInclusive(1, msgBgCount)
                        //console.log(lastBgImgs)
                        if (!lastBgImgs.includes(randBG)) {
                            break
                        }
                    }
                    lastBgImgs.push(randBG)
                    if (lastBgImgs.length > 5) {
                        lastBgImgs.splice(0, 1)
                    }

                    var imgsDOM = '<br><br>'
                    try {
                        if (comment.image != '') {
                            for (var i of comment.image.split(',')) {
                                imgsDOM += `<img src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this)">`
                            }
                        }
                    } catch (error) {

                    }

                    commentDiv.insertBefore(html2elmnt(`
                    <div class="commentBox">
                        <img class="bg" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${randBG}.jpg">
                        <div class="bgcover"></div>
                        <img class="avatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${comment.sender}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'">
                        <div class="sender">${comment.sender == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : comment.sender}</div>
                        <div class="id">#${comment.id}</div>
                        <div class="comment" onwheel="if (!isFullscreen) event.preventDefault()">
                            ${comment.comment.replace(/\n/g, "<br/>")}
                            ${imgsDOM}
                        </div>
                        <div class="time">${date + ' ' + hour}</div>
                    </div>
                `), document.getElementById('loadingIndicator'))

                    //commentDiv.appendChild()

                    if (minCommentID == null) {
                        minCommentID = comment.id
                    }
                    if (maxCommentID == null) {
                        maxCommentID = comment.id
                    }
                    if (comment.id < minCommentID) {
                        minCommentID = comment.id
                    }
                    if (comment.id > maxCommentID) {
                        maxCommentID = comment.id
                    }
                    //console.log('min: ' + minCommentID + '  max: ' + maxCommentID)

                } else {

                    if (comment.hidden == 1 && !document.getElementById('showHidden').checked) {
                        console.log('skipping hidden comment #' + comment.id + ' ' + comment.comment)
                        continue
                    }
                    if (comment.id == -999999 && from > maxCommentID && maxCommentID) {
                        console.log('comments are up to date')
                        document.getElementById('loadingIndicatorBefore').style.display = 'none'
                        return
                    }
                    if (comment.id == -999999 && from < minCommentID && minCommentID) {
                        console.log('reached the oldest comment')
                        document.getElementById('loadingIndicator').style.display = 'none'
                        return
                    }
                    if (comment.id > maxCommentID && maxCommentID != null && document.getElementById('newCommentBox') != null && document.getElementById('topComment') == null) {
                        console.log('newCommentBox is active, skipping upper comments')
                        document.getElementById('loadingIndicatorBefore').style.display = 'none'
                        return
                    }

                    if (comment.id < minCommentID || minCommentID == null) {
                        appendComment(comment)
                    } else if (comment.id > maxCommentID && maxCommentID != null) {
                        appendComment(comment, prevLatestCommentEl)
                    } else {
                        console.log('skipping exist comment ID ' + comment.id)
                    }

                    if (xhrMinCommentID == null) {
                        xhrMinCommentID = comment.id
                    }
                    if (xhrMaxCommentID == null) {
                        xhrMaxCommentID = comment.id
                    }
                    if (comment.id < xhrMinCommentID) {
                        xhrMinCommentID = comment.id
                    }
                    if (comment.id > xhrMaxCommentID) {
                        xhrMaxCommentID = comment.id
                    }

                }
            }

            if (newLoadCommentMode) {
                if (from > maxCommentID && maxCommentID != null && document.getElementById('topComment') == null) {
                    if (isFullscreen) {
                        var newCommentTop = prevLatestCommentEl.getBoundingClientRect().top
                        commentDiv.scrollTop += newCommentTop - prevCommentTop
                    } else {
                        var newCommentLeft = prevLatestCommentEl.getBoundingClientRect().left
                        commentDiv.scrollLeft += newCommentLeft - prevCommentLeft
                    }
                }

                if (minCommentID == null) {
                    minCommentID = xhrMinCommentID
                }
                if (maxCommentID == null) {
                    maxCommentID = xhrMaxCommentID
                }
                if (xhrMinCommentID < minCommentID) {
                    minCommentID = xhrMinCommentID
                }
                if (xhrMaxCommentID > maxCommentID) {
                    maxCommentID = xhrMaxCommentID
                }

                if (debug) console.log('maxID:', maxCommentID, ' minID:', minCommentID)
            }

        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
}

function appendComment(comment, insertBeforeEl = document.getElementById('loadingIndicator')) {
    var time = new Date(comment.time * 1000)
    date = time.toLocaleDateString()
    hour = time.toLocaleTimeString()

    var randBG
    while (true) {
        randBG = getRandomIntInclusive(1, msgBgCount)
        if (!lastBgImgs.includes(randBG)) {
            break
        }
    }
    lastBgImgs.push(randBG)
    if (lastBgImgs.length > 5) {
        lastBgImgs.splice(0, 1)
    }

    var imgsDOM = '<br><br>'
    try {
        if (comment.image != '') {
            for (var i of comment.image.split(',')) {
                imgsDOM += `<img src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this)">`
            }
        }
    } catch (error) {

    }

    commentDiv.insertBefore(html2elmnt(`
        <div class="commentBox" id="#${comment.id}" data-timestamp="${comment.time}">
            <img class="bg" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${randBG}.jpg">
            <div class="bgcover"></div>
            <img class="avatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${comment.sender}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'">
            <div class="sender">${comment.sender == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : comment.sender}</div>
            <div class="id">#${comment.id}</div>
            <div class="comment" onwheel="if (!isFullscreen) event.preventDefault()">
                ${comment.comment.replace(/\n/g, "<br>")}
                ${imgsDOM}
            </div>
            <div class="time">${date + ' ' + hour}${(comment.hidden == 1) ? ' (hidden)' : ''}</div>
        </div>
    `), insertBeforeEl)
}

function sendMessage() {
    var sender = getCookie('username')
    var msg = document.getElementById('msgText').value

    var imgList = []
    var uploadImgClass = document.getElementsByClassName('uploadImg')
    if (uploadImgClass.length > 0) {
        for (var imgElmnt of uploadImgClass) {
            imgList.push(imgElmnt.src.split(';base64,')[1])
        }
    }

    if (msg.replace(/\s/g, '') == '') {
        window.alert('请输入留言内容!\nDo not leave the message empty!')
        return
    }
    if (sender.replace(/\s/g, '') == '') {
        sender = '匿名用户'
    }

    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').innerHTML = '<span class="ui zh">正在发送…</span><span class="ui en">Sending…</span>'

    var xhr = new XMLHttpRequest();
    var url = "https://haojiezhe12345.top:82/madohomu/api/post";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log(xhr.responseText);
            document.getElementById('sendBtn').innerHTML = '<span class="ui zh">发送成功!</span><span class="ui en">Sent!</span>'
            setTimeout(() => {
                clearComments()
                loadComments()
            }, 1000);
        }
    };
    xhr.onerror = () => {
        window.alert('发送留言失败\n如果问题持续, 请发邮件到3112611479@qq.com (或加此QQ)\n\nFailed to send message, if problem persists, please contact 3112611479@qq.com')
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('sendBtn').innerHTML = '<span class="ui zh">发送 ✔</span><span class="ui en">Send ✔</span>'
    }
    var data = JSON.stringify({
        "sender": sender,
        "comment": msg,
        'images': imgList
    });
    xhr.send(data);
}

function clearComments(clearTop) {
    //commentDiv.removeEventListener("scroll", commentScroll)
    if (clearTop == 1) {
        commentDiv.innerHTML = loadingIndicatorBefore + loadingIndicator
    } else {
        commentDiv.innerHTML = topComment + loadingIndicatorBefore + loadingIndicator
        document.getElementById('loadingIndicatorBefore').style.display = 'none'
    }
    minCommentID = null
    maxCommentID = null

    newCommentDisabled = false
    commentHorizontalScrolled = 0
}

var beforeLoadThreshold = 40

function commentScroll() {
    if (pauseCommentScroll || minCommentID == null || maxCommentID == null) return
    if (minCommentID == -999999 && maxCommentID == -999999) {
        document.getElementById('loadingIndicatorBefore').style.display = 'none'
        document.getElementById('loadingIndicator').style.display = 'none'
        return
    }

    if (!isFullscreen) {
        var scrolled = commentDiv.scrollLeft / (commentDiv.scrollWidth - commentDiv.clientWidth)
        //if (debug) console.log(scrolled)
        setTimelineActiveMonthByPercent(scrolled)

        var toRight = commentDiv.scrollWidth - commentDiv.clientWidth - commentDiv.scrollLeft
        var toLeft = commentDiv.scrollLeft
        //console.log(toLeft, toRight)
        if (toRight <= 40) {
            loadComments(minCommentID - 1)
        }
        else if (toLeft <= beforeLoadThreshold && newLoadCommentMode) {
            loadComments(maxCommentID + 10, 10)
        } else return

    } else {
        var scrolled = commentDiv.scrollTop / (commentDiv.scrollHeight - commentDiv.clientHeight)
        //if (debug) console.log(scrolled)
        setTimelineActiveMonthByPercent(scrolled)

        var toBottom = commentDiv.scrollHeight - commentDiv.clientHeight - commentDiv.scrollTop
        var toTop = commentDiv.scrollTop
        //console.log(toTop, toBottom)
        if (toBottom <= 40) {
            loadComments(minCommentID - 1)
        }
        else if (toTop <= beforeLoadThreshold && newLoadCommentMode) {
            var count = getFullscreenHorizonalCommentCount() * 2
            while (count < 9) {
                count += getFullscreenHorizonalCommentCount()
            }
            commentDiv.scrollTop = 0
            loadComments(maxCommentID + count, count)
        } else return
    }
    //commentDiv.removeEventListener("scroll", commentScroll)
    pauseCommentScroll = true
    setTimeout(() => {
        //commentDiv.addEventListener("scroll", commentScroll)
        pauseCommentScroll = false
    }, 500);
}

function newComment() {
    commentDiv.scrollLeft = 0
    commentDiv.scrollTop = 0

    if (newCommentDisabled) {
        document.getElementById('msgText').focus({ preventScroll: true })
        return
    }

    commentDiv.insertBefore(html2elmnt(`
        <div class="commentBox" id="newCommentBox">
            <div class="bgcover"></div>
            <img class="avatar" id="msgPopupAvatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'" onclick="showPopup('setNamePopup')">
            <div class="sender" id="senderText" onclick="showPopup('setNamePopup')">${getCookie('username')}</div>
            <div class="id" onclick="showPopup('setNamePopup')"><span class="ui zh">设置昵称/头像</span><span class="ui en">Change profile</span></div>
            <div class="comment">
                <textarea id="msgText" placeholder="圆神保佑~" style="height: 100%"></textarea>
                <div id="uploadImgList" style="display: none"></div>
            </div>
            <label>
                <input id="uploadImgPicker" type="file" onchange="previewLocalImgs()" multiple style="display: none;" />
                <span><span class="ui zh">+ 添加图片</span><span class="ui en">+ Add images</span></span>
            </label>
            <button id="sendBtn" onclick="sendMessage()"><span class="ui zh">发送 ✔</span><span class="ui en">Send ✔</span></button>
        </div>
    `), commentDiv.firstElementChild)

    document.getElementById('msgText').addEventListener('focusin', () => {
        //console.log('msgText focused')
        document.getElementById('lowerPanel').classList.add('lowerPanelUp')
    })
    document.getElementById('msgText').addEventListener('focusout', () => {
        //console.log('msgText lost focus')
        //document.getElementById('lowerPanel').classList.remove('lowerPanelUp')
    })

    document.getElementById('msgText').focus({ preventScroll: true })

    newCommentDisabled = true

    if (location.hostname != 'haojiezhe12345.top') {
        document.getElementById('banner').style.display = 'block'
    }
}

function previewLocalImgs() {
    var imgUploadInput = document.getElementById('uploadImgPicker')

    if (imgUploadInput.files.length === 0) {
        console.log('No file chosen')
        return;
    }

    for (let imgfile of imgUploadInput.files) {

        //console.log(imgfile)
        if (!imgfile.type.match(/image.*/)) {
            console.log(`Invalid image file ${imgfile.name}`)
            continue;
        }

        let fileReader = new FileReader();
        fileReader.readAsDataURL(imgfile);
        fileReader.onload = () => {

            //console.log(fileReader.result)
            let image = new Image();
            image.src = fileReader.result;
            image.onload = () => {

                //console.log(image)
                var MAX_WIDTH = 1200;
                var MAX_HEIGHT = 1200;
                var width = image.width;
                var height = image.height;
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                var canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0, width, height);

                imgDataURL = canvas.toDataURL("image/jpeg")

                //uploadImgList.push(imgDataURL.split(';base64,')[1])

                document.getElementById('uploadImgList').appendChild(html2elmnt(`
                    <div>
                        <img src="${imgDataURL}" class="uploadImg" onclick="viewImg(this)">
                        <button onclick="this.parentNode.remove()">❌</button>
                    </div>
                `))
                document.getElementById('msgText').style = ''
                document.getElementById('uploadImgList').style = ''
            }
        };
    }

    imgUploadInput.value = ''
}

function viewImg(elmnt) {
    //window.open(elmnt.src, '_blank').focus()
    document.getElementById('imgViewer').src = elmnt.src
    document.getElementById('imgViewerBox').style.display = 'block'
    document.getElementById('viewport1').setAttribute('content', 'width=device-width, initial-scale=1.0')
    window.location.hash = 'view-img'

    imgViewerMouseActive = false
    imgViewerOffsetX = 0
    imgViewerOffsetY = 0
    imgViewerScale = 1
    document.getElementById('imgViewer').style.transform = 'translateX(0px) translateY(0px) scale(1)'
}

function closeImgViewer() {
    document.getElementById('imgViewerBox').style.display = 'none';
    document.getElementById('viewport1').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function showPopup(popupID) {
    var popupContainer = document.getElementById('popupContainer');
    popupContainer.style.display = 'flex';

    var popup = document.getElementById(popupID);
    popup.style.display = 'block';

    document.getElementById('setNameInput').value = getCookie('username')
    avatarInput.value = ''
    setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`
    setAvatarImg.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }

    if (popupID == 'getImgPopup') {
        let j = 0
        for (let i = 0; i < 6; i++, j++) {
            document.getElementsByClassName('getImgList')[j].src = `https://haojiezhe12345.top:82/madohomu/bg/mainbg${i + 1}.jpg`
        }
        for (let i = 0; i < 4; i++, j++) {
            document.getElementsByClassName('getImgList')[j].src = `https://haojiezhe12345.top:82/madohomu/bg/birthday/mainbg${i + 1}.jpg`
        }
        for (let i = 0; i < 1; i++, j++) {
            document.getElementsByClassName('getImgList')[j].src = `https://haojiezhe12345.top:82/madohomu/bg/night/mainbg${i + 1}.jpg`
        }
        for (let i = 0; i < 1; i++, j++) {
            document.getElementsByClassName('getImgList')[j].src = `https://haojiezhe12345.top:82/madohomu/bg/kami/mainbg${i + 1}.jpg`
        }
        for (let i = 0; i < msgBgCount; i++, j++) {
            document.getElementsByClassName('getImgList')[j].src = `https://haojiezhe12345.top:82/madohomu/bg/msgbg${i + 1}.jpg`
        }
    }
}

function closePopup() {
    var popupContainer = document.getElementById('popupContainer');
    popupContainer.style.display = 'none';

    var elements = document.getElementsByClassName('popupItem');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }
    loadUserInfo()

    try {
        document.getElementById('senderText').innerHTML = getCookie('username')
        document.getElementById('msgPopupAvatar').src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`
        document.getElementById('msgPopupAvatar').onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    } catch (error) {

    }
}

function showMsgWindow() {
    if (getCookie('username') == '') {
        showPopup('setNamePopup')
    } else {
        showPopup('msgPopup')
    }
}

function setUserName() {
    inputName = document.getElementById('setNameInput').value;

    try {
        var invalidFileChars = "\\/:*?\"<>|;";
        var validFileChars = "＼／：＊？＂＜＞｜；";
        for (i = 0; i < invalidFileChars.length; i++) {
            //var re = new RegExp(invalidFileChars[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            //inputName = inputName.replace(re, validFileChars[i]);
            inputName = inputName.split(invalidFileChars[i]).join(validFileChars[i])
        }
    } catch (error) {
        console.log(error)
    }

    setCookie('username', inputName)
    closePopup()
    if (getCookie('username') == '' || getCookie('username') == '匿名用户') {
        //showPopup('msgPopup')
    } else if (getCookie('username') == '10.3') {
        location.reload()
    } else {
        showPopup('setAvatarPopup')
    }
}

function uploadAvatar() {

    if (avatarInput.files.length === 0) {
        console.log('No file chosen')
        return;
    }
    if (!avatarInput.files[0].type.match(/image.*/)) {
        window.alert("图片无效\nInvalid image");
        return;
    }

    var fileReader = new FileReader();
    fileReader.onload = () => {
        var image = new Image();
        image.onload = () => {

            var MIN_WIDTH = 200;
            var MIN_HEIGHT = 200;
            var width = image.width;
            var height = image.height;
            if (width > height) {
                if (height > MIN_HEIGHT) {
                    width *= MIN_HEIGHT / height;
                    height = MIN_HEIGHT;
                }
            } else {
                if (width > MIN_WIDTH) {
                    height *= MIN_WIDTH / width;
                    width = MIN_WIDTH;
                }
            }

            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob((blob) => {

                var xhr = new XMLHttpRequest();
                xhr.open("POST", "https://haojiezhe12345.top:82/madohomu/api/upload");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        console.log(xhr.responseText);
                        setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`
                    }
                };
                var formData = new FormData();
                formData.append(`${getCookie('username')}.jpg`, blob)
                xhr.send(formData);

            }, "image/jpeg")
        }
        image.src = fileReader.result;
    };
    fileReader.readAsDataURL(avatarInput.files[0]);
}

function loadUserInfo() {
    var avatar = document.getElementById('userInfoAvatar')
    var name = document.getElementById('userInfoName')

    avatar.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    avatar.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getCookie('username')}.jpg?${new Date().getTime()}`

    if (getCookie('username') == '') {
        name.innerHTML = '<span class="ui zh">访客</span><span class="ui en">Anonymous</span>'
    } else {
        name.innerText = getCookie('username')
    }
}

// themes
//
function nextImg() {
    if (bgPaused) return

    var prevBG = currentBG
    if (currentBG + 1 < bgCount) {
        currentBG += 1
    } else {
        currentBG = 0
    }
    var nextBG
    if (currentBG + 1 < bgCount) {
        nextBG = currentBG + 1
    } else {
        nextBG = 0
    }

    //if (isBirthday) {
    if (theme != 'default') {
        var bgs = document.getElementsByClassName(`${theme}bg`)
        var bgurl = `https://haojiezhe12345.top:82/madohomu/bg/${theme}/`
    } else {
        var bgs = document.getElementsByClassName('defaultbg')
        var bgurl = 'https://haojiezhe12345.top:82/madohomu/bg/'
    }

    bgs[prevBG].style.opacity = 0
    //bgs[currentBG].style.display = 'block'
    bgs[currentBG].style.opacity = 1
    bgs[currentBG].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${currentBG + 1}.jpg?2")`
    bgs[currentBG].firstElementChild.style.removeProperty('animation-name')
    setTimeout(() => {
        bgs[prevBG].firstElementChild.style.animationName = 'none'
        //bgs[nextBG].style.display = 'block'
        bgs[nextBG].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${nextBG + 1}.jpg?2")`
        bgs[nextBG].firstElementChild.style.animationName = 'none'
    }, 2500);

}

function nextCaption() {
    if (bgPaused) return

    if (theme == 'birthday') {
        document.getElementById('birthdayCaption').style.display = 'block'
        setTimeout(() => {
            captionDiv.style.opacity = 1
        }, 500);
        return
    }

    captionDiv.style.opacity = 0
    setTimeout(() => {
        var elements = document.getElementsByClassName(`${theme}Caption`);
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.display = 'none';
        }
        if (currentCaption < elements.length - 1) {
            currentCaption++
        } else {
            currentCaption = 0
        }
        elements[currentCaption].style.display = 'block';
        if (currentCaption % 2 == 0) {
            captionDiv.style.textAlign = 'left'
            elements[currentCaption].style.color = 'rgb(255, 189, 210)'
        } else {
            captionDiv.style.textAlign = 'right'
            elements[currentCaption].style.color = 'rgb(209, 133, 255)'
        }
        captionDiv.style.opacity = 1
    }, 1500);
}

function playWalpurgis(time_ms) {
    document.getElementById('videoBgBox').style.opacity = 1
    document.getElementById('videoBgBox').style.display = 'block'
    document.getElementById('mainVideo').src = 'https://haojiezhe12345.top:82/madohomu/media/walpurgis1.1.mp4'
    document.getElementById('mainVideo').play()
    //document.getElementById('mainVideoBg').src = 'https://haojiezhe12345.top:82/madohomu/media/walpurgis1.1.mp4'
    //document.getElementById('mainVideoBg').play()
    setTimeout(() => {
        document.getElementById('videoBgBox').style.opacity = 0
        setTimeout(() => {
            document.getElementById('videoBgBox').style.display = 'none'
        }, 1000);
    }, time_ms);
}

function changeLang(targetLang) {
    if (targetLang != 'zh' && targetLang != 'en') {
        console.log(`invalid lang "${targetLang}"`)
        return
    }
    mainCSS = document.getElementById('langCSS').innerHTML = `
    .ui {
        display: none !important;
    }
    .ui.${targetLang} {
        display: inline !important;
    }
    `
    currentLang = targetLang
    console.log(`changed lang to ${targetLang}`)
}

function changeGraphicsMode(mode) {
    if (mode == 'high') {
        document.getElementById('lowendCSS').disabled = true
    } else if (mode == 'mid') {
        document.getElementById('lowendCSS').href = 'index_midend.css'
        document.getElementById('lowendCSS').disabled = false
    } else if (mode == 'low') {
        document.getElementById('lowendCSS').href = 'index_lowend.css'
        document.getElementById('lowendCSS').disabled = false
    } else return
    setCookie('graphicsMode', mode)
}

function getFullscreenHorizonalCommentCount() {
    if (!isFullscreen) return null
    var latestCommentEl = document.getElementById('loadingIndicatorBefore').nextElementSibling
    var top = latestCommentEl.getBoundingClientRect().top
    latestCommentEl = latestCommentEl.nextElementSibling
    var count = 1
    while (top == latestCommentEl.getBoundingClientRect().top) {
        count++
        latestCommentEl = latestCommentEl.nextElementSibling
    }
    return count
}

function loadTimeline(timeStamp) {
    console.log('loading timeline from', timeStamp)

    var timelineEl = document.getElementById('timeline')
    timelineEl.innerHTML = ''
    var date = new Date(timeStamp * 1000)

    while (date.getFullYear() >= 2019) {

        var yearEl = document.createElement('p')
        yearEl.appendChild(html2elmnt(`<strong>${date.getFullYear()}</strong>`))

        while (true) {
            yearEl.appendChild(html2elmnt(`<span>${date.getMonth() + 1}</span>`))

            if (date.getFullYear() == 2023 && date.getMonth() + 1 == 6) {
                date.setFullYear(2022)
                date.setMonth(3)
                break
            } else if (date.getFullYear() == 2019 && date.getMonth() + 1 == 2) {
                date.setFullYear(2011)
                break
            } else if (date.getMonth() == 0) {
                break
            } else {
                date.setMonth(date.getMonth() - 1)
            }
        }
        timelineEl.appendChild(yearEl)

        date.setMonth(date.getMonth() - 1)
    }
}

function setTimelineActiveMonthByPercent(percent) {
    var id = minCommentID + Math.ceil((maxCommentID - minCommentID) * (1 - percent))
    try {
        var timeStamp = parseInt(document.getElementById(`#${id}`).dataset.timestamp) * 1000
        var date = new Date(timeStamp)
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        //if (debug) console.log(id, timeStamp, year, month)
        for (var yearEl of document.getElementById('timeline').children) {
            if (yearEl.firstElementChild.innerHTML == year) {
                yearEl.firstElementChild.classList.add('month-active')
            } else {
                yearEl.firstElementChild.classList.remove('month-active')
            }
            for (var monthEl of yearEl.children) {
                if (monthEl.nodeName == 'SPAN') {
                    if (yearEl.firstElementChild.innerHTML == year && monthEl.innerHTML == month) {
                        monthEl.classList.add('month-active')
                    } else {
                        monthEl.classList.remove('month-active')
                    }
                }
            }
        }
    } catch (error) {
        if (debug) console.log(error)
    }
}

function setTodayCommentCount() {
    var utc = parseInt(0 - new Date().getTimezoneOffset() / 60)
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments/count?utc=${utc}`);
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            document.getElementById('todayCommentCount').innerHTML = xhr.responseText
            console.log('today comment count:', xhr.responseText)
        }
    }
    xhr.send();
}

// toggles
//
function goFullscreen() {
    if (!isFullscreen) {
        var scrollPercent = commentDiv.scrollLeft / (commentDiv.scrollWidth - commentDiv.clientWidth)
        document.getElementById('fullscreenCSS').disabled = false
        setTimeout(() => {
            commentDiv.scrollTop = (commentDiv.scrollHeight - commentDiv.clientHeight) * scrollPercent
        }, 200);
        document.getElementById('fullscreenBtn').innerHTML = '<span class="ui zh">退出全屏 ↙</span><span class="ui en">Collapse ↙</span>'
        isFullscreen = true
    } else {
        var scrollPercent = commentDiv.scrollTop / (commentDiv.scrollHeight - commentDiv.clientHeight)
        document.getElementById('fullscreenCSS').disabled = true
        setTimeout(() => {
            commentDiv.scrollLeft = (commentDiv.scrollWidth - commentDiv.clientWidth) * scrollPercent
        }, 200);
        document.getElementById('fullscreenBtn').innerHTML = '<span class="ui zh">全屏 ↗</span><span class="ui en">Expand ↗</span>'
        isFullscreen = false
    }
    pauseCommentScroll = true
    setTimeout(() => {
        pauseCommentScroll = false
    }, 500);
}

/*
function toggleLowend() {
    if (isLowendElmnt.checked) {
        //document.head.appendChild(html2elmnt('<link rel="stylesheet" href="index_lowend.css" type="text/css" id="lowendCSS">'))
        document.getElementById('lowendCSS').disabled = false
    } else {
        document.getElementById('lowendCSS').disabled = true
    }
    setCookie('isLowend', isLowendElmnt.checked)
}
*/

function toggleBGM() {
    setCookie('mutebgm', isMutedElmnt.checked)
    bgmElmnt.muted = isMutedElmnt.checked
}

function toggleTopComment() {
    setCookie('hideTopComment', hideTopCommentElmnt.checked)
    if (hideTopCommentElmnt.checked) {
        topComment = `
        <div class="commentBox" id="topComment" style="display: none;">
            ${document.getElementById('topComment').innerHTML}
        </div>
        `
        document.getElementById('topComment').style.display = 'none'
    } else {
        topComment = `
        <div class="commentBox" id="topComment">
            ${document.getElementById('topComment').innerHTML}
        </div>
        `
        document.getElementById('topComment').style.display = ''
    }
}

function toggleTimeline() {
    setCookie('showTimeline', showTimelineElmnt.checked)
    if (showTimelineElmnt.checked) {
        document.getElementById('timelineContainer').style.display = 'block'
        commentDiv.classList.add('noscrollbar')
    } else {
        document.getElementById('timelineContainer').style.display = 'none'
        commentDiv.classList.remove('noscrollbar')
    }
}

// functional funcs
//
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

function setCookie(cname, cvalue, exdays = 999) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function html2elmnt(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
}


// common vars
//
var minCommentID = null
var maxCommentID = null
var pauseCommentScroll = false
var maxCommentTime = 0

var commentDiv = document.getElementById('comments')
var captionDiv = document.getElementById('mainCaptions')

var setAvatarImg = document.getElementById('setAvatarImg')
var avatarInput = document.getElementById('setAvatarInput')

var bgmElmnt = document.getElementById('bgm')

var isMutedElmnt = document.getElementById('isMuted')
//var isLowendElmnt = document.getElementById('isLowend')
var hideTopCommentElmnt = document.getElementById('hideTopComment')
var showTimelineElmnt = document.getElementById('showTimeline')

var topComment = `
<div class="commentBox" id="topComment">
    ${document.getElementById('topComment').innerHTML}
</div>
`
var loadingIndicator = `
<div class="commentBox loadingIndicator" id="loadingIndicator">
    ${document.getElementById('loadingIndicator').innerHTML}
</div>
`
var loadingIndicatorBefore = `
<div class="commentBox loadingIndicator" id="loadingIndicatorBefore">
    ${document.getElementById('loadingIndicatorBefore').innerHTML}
</div>
`
document.getElementById('loadingIndicatorBefore').style.display = 'none'

var bgPaused = false
var isFullscreen = false
var newCommentDisabled = false

var currentLang = 'zh'
if (getCookie('lang') != '') {
    currentLang = getCookie('lang')
} else if (navigator.language.slice(0, 2) != 'zh' && navigator.language.slice(0, 3) != 'yue') {
    currentLang = 'en'
}
if (currentLang == 'en') changeLang('en')

var debug = false
if (location.hash == '#debug') {
    debug = true
    document.getElementById('lowerPanel').classList.add('lowerPanelUp')
}


// theme
//
var theme = 'default'

var d = new Date()
if ((d.getMonth() + 1 == 10 && d.getDate() == 3) || location.hash == '#birthday') {
    theme = 'birthday'
    var yearsOld = d.getFullYear() - 2011
    document.getElementById('birthdayDate').innerHTML = `10/3/${d.getFullYear()} - Madoka's ${yearsOld}th birthday`
}
else if ((getCookie('theme') == 'kami' || location.hash == '#kami') && location.hash != '#default-theme') {
    theme = 'kami'
    try {
        printParaCharOneByOne('kamiCaption', 750)
    } catch (error) {
        console.log(error)
    }
}
else if (((d.getHours() >= 23 || d.getHours() <= 5) || location.hash == '#night') && location.hash != '#default-theme') {
    theme = 'night'
}

if (theme == 'kami' || theme == 'night') {
    document.getElementsByClassName(`${theme}bg`)[0].style.opacity = 1
    document.getElementsByClassName(`${theme}bg`)[0].firstElementChild.style.backgroundImage = `url("https://haojiezhe12345.top:82/madohomu/bg/${theme}/mainbg1.jpg")`

    document.getElementById(`${theme}Caption`).style.display = 'block'
    setTimeout(() => {
        captionDiv.style.opacity = 1
    }, 500);

    bgPaused = true
}

if (theme == 'birthday') {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/mataashita.mp3'
} else if (theme == 'night') {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/night_16k.mp3'
} else if (Math.random() > 0.5) {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/bgm_16k.mp3'
} else {
    bgmElmnt.src = 'https://haojiezhe12345.top:82/madohomu/media/bgm1_16k.mp3'
}

// cookies toggles
//
if (getCookie('mutebgm') == 'false' || getCookie('mutebgm') == '') {
    document.getElementById('bgm').play()
} else {
    isMutedElmnt.checked = true
}

/*
if (getCookie('isLowend') == 'true') {
    isLowendElmnt.checked = true
    //document.head.appendChild(html2elmnt('<link rel="stylesheet" href="index_lowend.css" type="text/css" id="lowendCSS">'))
    document.getElementById('lowendCSS').disabled = false
}
*/
if (getCookie('graphicsMode') != '') {
    changeGraphicsMode(getCookie('graphicsMode'))
}

if (getCookie('hideTopComment') == 'true') {
    hideTopCommentElmnt.checked = true
    document.getElementById('topComment').style.display = 'none'
    topComment = `
    <div class="commentBox" id="topComment" style="display: none;">
        ${document.getElementById('topComment').innerHTML}
    </div>
    `
}

if (getCookie('hiddenBanner') != document.getElementById('banner').classList[0]) {
    document.getElementById('banner').style.display = 'block'
}

if (getCookie('showTimeline') == 'false') {
    showTimelineElmnt.checked = false
    toggleTimeline()
}

// background images
//
var bgCount
bgCount = document.getElementsByClassName(`${theme}bg`).length
/*
if (isBirthday) {
    bgCount = document.getElementsByClassName('birthdaybg').length
} else {
    bgCount = document.getElementsByClassName('defaultbg').length
}
*/

var currentBG = bgCount - 1
var currentCaption = -1

function playBG() {
    nextImg()
    setInterval(nextImg, 8000)
    setTimeout(() => {
        //document.getElementById('mainbg1').classList.remove('bgzoom')
        document.getElementsByClassName('defaultbg')[0].classList.remove('bgzoom')
        document.getElementsByClassName('birthdaybg')[0].classList.remove('bgzoom')
        document.getElementsByClassName('nightbg')[0].classList.remove('bgzoom')
    }, 10000);

    nextCaption()
    setInterval(nextCaption, 8000)
}
if (location.hash == '#video') {
    time_ms = 5000
    playWalpurgis(time_ms)

    document.getElementsByClassName('walpurgisbg')[0].style.opacity = 1
    document.getElementsByClassName('walpurgisbg')[0].style.display = 'block'
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.backgroundImage = `url("https://haojiezhe12345.top:82/madohomu/bg/walpurgis/mainbg1.jpg")`
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.animationName = 'bgzoom'
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.animationDuration = '1.5s'

    var unmuteBGM = false
    if (bgmElmnt.muted == false) {
        bgmElmnt.muted = true
        unmuteBGM = true
    }
    setTimeout(() => {
        document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.removeProperty('animation-name')
        document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.removeProperty('animation-duration')
        setTimeout(() => {
            document.getElementsByClassName('walpurgisbg')[0].style.opacity = 0
            playBG()
            setTimeout(() => {
                if (unmuteBGM) {
                    bgmElmnt.muted = false
                }
            }, 2000);
        }, 8000);
    }, time_ms);

} else {
    playBG()
}

loadUserInfo()


// comments
//
loadComments()
setTimeout(() => {
    commentDiv.addEventListener("scroll", commentScroll)
}, 500);
setInterval(commentScroll, 1000)

var commentHorizontalScrolled = 0
var altScrollmode = false

commentDiv.addEventListener("wheel", (event) => {
    if (altScrollmode == 1) {
        console.info(event.deltaY)
        console.info(commentDiv.scrollLeft)
        commentHorizontalScrolled += event.deltaY * 1
        if (commentHorizontalScrolled < 0) commentHorizontalScrolled = 0
        if (commentHorizontalScrolled > (commentDiv.scrollWidth - commentDiv.clientWidth)) commentHorizontalScrolled = commentDiv.scrollWidth - commentDiv.clientWidth
        console.log(commentHorizontalScrolled)
        commentDiv.scrollLeft = commentHorizontalScrolled
    } else if (altScrollmode == 2 && event.deltaX == 0) {
        console.info(event)
        const e1 = new WheelEvent("wheel", {
            deltaX: event.deltaY,
            deltaMode: 0,
        });
        console.info(e1)
        commentDiv.dispatchEvent(e1)
    } else {
        commentDiv.scrollLeft += event.deltaY
    }
});

var msgBgCount = 11
var lastBgImgs = []


// timeline
//
document.getElementById('timelineContainer').addEventListener('click', (event) => {
    //if (debug) console.log(event.target)
    if (event.target.nodeName == 'STRONG') {
        var year = parseInt(event.target.innerHTML)
        if (year == 2022 || event.target == document.getElementById('timeline').firstElementChild.firstElementChild) {
            clearComments((year == 2022) ? 1 : null)
            loadComments((year == 2022) ? 0 : null)
            return
        }
        var date = new Date(year + 1, 0, 0)
    } else if (event.target.nodeName == 'SPAN') {
        if (event.target.classList[0] == 'month-active') return
        var year = parseInt(event.target.parentNode.firstElementChild.innerHTML)
        var month = parseInt(event.target.innerHTML)
        var date = new Date(year, month - 1)
    } else if (event.target.hasAttribute('data-time')) {
        var date = new Date(event.target.dataset.time)
    } else return
    timestamp = date.getTime() / 1000
    //console.log(timestamp)
    clearComments(1)
    loadComments(null, null, timestamp)
})

document.getElementById('timelineContainer').addEventListener('wheel', (event) => {
    if (!isFullscreen)
        document.getElementById('timeline').scrollLeft += event.deltaY / 2
})

document.getElementById('timelineContainer').addEventListener('mouseover', (event) => {
    if (event.target.nodeName == 'SPAN') {
        if (!isFullscreen) {
            document.getElementById('hoverCalendar').style.left = event.target.getBoundingClientRect().left + event.target.getBoundingClientRect().width / 2 + 'px'
            document.getElementById('hoverCalendar').style.bottom = document.getElementById('timelineContainer').getBoundingClientRect().height + 'px'
            document.getElementById('hoverCalendar').style.removeProperty('top')
            document.getElementById('hoverCalendar').style.removeProperty('right')
        }
        else {
            document.getElementById('hoverCalendar').style.top = event.target.getBoundingClientRect().top + event.target.getBoundingClientRect().height / 2 + 'px'
            document.getElementById('hoverCalendar').style.right = document.getElementById('timelineContainer').getBoundingClientRect().width + 'px'
            document.getElementById('hoverCalendar').style.removeProperty('left')
            document.getElementById('hoverCalendar').style.removeProperty('bottom')
        }
        document.getElementById('hoverCalendar').style.removeProperty('display')

        document.getElementById('hoverCalendar').innerHTML = ''
        var year = parseInt(event.target.parentNode.firstElementChild.innerHTML)
        var month = parseInt(event.target.innerHTML)
        document.getElementById('hoverCalendar').appendChild(html2elmnt(`<div>${year}-${('0' + month).slice(-2)}${(year <= 2022) ? ' (kami.im)' : ''}</div>`))
        for (let i = 1; i <= new Date(year, month, 0).getDate(); i++) {
            if (new Date(year, month - 1, i).getTime() / 1000 < maxCommentTime)
                document.getElementById('hoverCalendar').appendChild(html2elmnt(`<div data-time="${new Date(year, month - 1, i).toDateString()}">${i}</div>`))
        }
    } else if (event.target.nodeName == 'STRONG') {
        document.getElementById('hoverCalendar').style.display = 'none'
    }
})

document.getElementById('goto').addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        clearComments(1);
        loadComments(document.getElementById('goto').value)
    }
})

// image viewer
//
var imgViewerMouseActive = false
var imgViewerOffsetX = 0
var imgViewerOffsetY = 0
var imgViewerScale = 1
var imgViewerMouseMoved = false

document.onkeydown = function (e) {
    //console.log(e.key)
    if (e.key == 'Escape') {
        if (document.getElementById('popupContainer').style.display == 'flex') {
            closePopup()
        } else {
            imgvwr = document.getElementById('imgViewerBox')
            if (imgvwr.style.display == 'block') {
                history.back()
            }
        }
    }
}

if (window.location.hash == '#view-img') {
    window.location.hash = ''
}

window.onhashchange = function (e) {
    //console.log(e.oldURL.split('#')[1], e.newURL.split('#')[1])
    if (e.oldURL.split('#')[1] == 'view-img') {
        closeImgViewer()
    }
}

// PWA init
//
var installPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    //console.log(`'beforeinstallprompt' event was fired.`);
});

var isInStandaloneMode = false
isInStandaloneMode = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');


//var uploadImgList = []

/*
var isBGMPlaying = false
setTimeout(() => {
    document.body.innerHTML += `
    <audio id="bgm" src="bgm.mp3" muted loop controls></audio>
    `
    var audio = document.getElementById('bgm')
    audio.play()
}, 1000);
//document.addEventListener('ontouchstart', audio.play())
//document.addEventListener('onmousemove', audio.play())
//audio.play()
*/
