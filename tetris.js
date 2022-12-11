"use strict";

var canvas;
var gl;
var program;
var image;

var texture=[];
var points = [];
var normals=[];
var colors = [];
var texCoords=[];

//Blocks

var blocks=[
    [
        [
            [0,0,1,0],
            [0,0,1,0],
            [0,0,1,0],
            [0,0,1,0]
        ],
        [
            [0,0,0,0],
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0]
        ],
        [
            [0,1,0,0],
            [0,1,0,0],
            [0,1,0,0],
            [0,1,0,0]
        ],
        [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0]
        ]
    ],
    [
        [
            [1,0,0],
            [1,1,0],
            [0,1,0]
        ],
        [
            [0,1,1],
            [1,1,0],
            [0,0,0]
        ]
    ],
    [
        [
            [0,1,0],
            [1,1,0],
            [1,0,0]
        ],
        [
            [1,1,0],
            [0,1,1],
            [0,0,0]
        ],
    ],
    [
        [
            [0,1,1],
            [0,1,0],
            [0,1,0]
        ],
        [
            [0,0,0],
            [1,1,1],
            [0,0,1]
        ],
        [
            [0,1,0],
            [0,1,0],
            [1,1,0]
        ],
        [
            [1,0,0],
            [1,1,1],
            [0,0,0]
        ]
    ],
    [
        [
            [1,1,0],
            [0,1,0],
            [0,1,0]
        ],
        [
            [0,0,1],
            [1,1,1],
            [0,0,0]
        ],
        [
            [0,1,0],
            [0,1,0],
            [0,1,1]
        ],
        [
            [0,0,0],
            [1,1,1],
            [1,0,0]
        ]
    ],
    [
        [
            [1,1],
            [1,1]
        ]
    ],
    [
        [
            [0,1,0],
            [1,1,0],
            [0,1,0]
        ],
        [
            [0,1,0],
            [1,1,1],
            [0,0,0]
        ],
        [
            [0,1,0],
            [0,1,1],
            [0,1,0]
        ],
        [
            [0,0,0],
            [1,1,1],
            [0,1,0]
        ]
    ]
]
//canvas
var canvasWidth;
var canvasHeight;
var texture;

//board
var boardRow=20;
var boardCol=10;
var isPlacedBlock;
var boardRowToCanvas;
var boardColToCanvas;

//input
var isPressLeftButton;
var isPressRightButton;
var isLeftRotate;
var isRightRotate;
var isDrop;

var rotate;
var direction;
var moveDown;

//in-game
var speed=5;
var waitTime=0;
var scores=[0,100,300,600,1000];

//FrameTime
var previousTime,nowTime;

//MovingBlock
var nowBlock=null;
var nowBlockIndex;
var nowRow,nowCol;
var rotate_index; //1 -> d


//Texture info
var textureQuad=[];


function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}


function IsInBlock(row,col){
    return isPlacedBlock[row][col]!=-1;
}

function OnLoad(){
    var textureRow=24;
    var textureCol=textureRow*7;
    for(var col=0;col<textureCol;col+=textureRow){
        var temp=[];
        var left_col=col/textureCol;
        var right_col=(col+textureRow-1)/textureCol;
        temp.push(vec2(left_col,0));
        temp.push(vec2(right_col,0));
        temp.push(vec2(right_col,1));
        temp.push(vec2(left_col,1));
        textureQuad.push(temp);
    }
    boardRowToCanvas=[];
    for(var row=0;row<boardRow;++row){
        var rowStart=row*textureRow;
        boardRowToCanvas.push(1-rowStart*2/canvasHeight);
    }
    boardRowToCanvas.push(-1);
    boardColToCanvas=[];
    for(var col=0;col<boardCol;++col){
        var colStart=col*textureRow;
        boardColToCanvas.push(-1+colStart*2/canvasWidth);
    }
    boardColToCanvas.push(1);
}

function quad(vertexs,textures){
    points.push(vertexs[0])
    texCoords.push(textures[0]);
    points.push(vertexs[1])
    texCoords.push(textures[1]);
    points.push(vertexs[2])
    texCoords.push(textures[2]);
    points.push(vertexs[0])
    texCoords.push(textures[0]);
    points.push(vertexs[2])
    texCoords.push(textures[2]);
    points.push(vertexs[3])
    texCoords.push(textures[3]);
}

function DrawGameDisplay(){
    points=[];
    texCoords=[];
    //이미 놓여진 블록들 그리기
    for(var i=0;i<boardRow;++i){
        for(var j=0;j<boardCol;++j){
            if(IsInBlock(i,j)){
                var vertexs=[
                    [boardColToCanvas[j],boardRowToCanvas[i]],
                    [boardColToCanvas[j+1],boardRowToCanvas[i]],
                    [boardColToCanvas[j+1],boardRowToCanvas[i+1]],
                    [boardColToCanvas[j],boardRowToCanvas[i+1]]
                ];
                quad(vertexs,textureQuad[isPlacedBlock[i][j]]);
            }
        }
    }

    //떨어지는 블록 그리기
    if(nowBlock!=null){
        for(var i=0;i<nowBlock[rotate_index].length;++i){
            for(var j=0;j<nowBlock[rotate_index][i].length;++j){
                if(nowBlock[rotate_index][i][j]==1){
                    var vertexs=[
                        [boardColToCanvas[nowCol+j],boardRowToCanvas[nowRow+i]],
                        [boardColToCanvas[nowCol+j+1],boardRowToCanvas[nowRow+i]],
                        [boardColToCanvas[nowCol+j+1],boardRowToCanvas[nowRow+i+1]],
                        [boardColToCanvas[nowCol+j],boardRowToCanvas[nowRow+i+1]]
                    ];
                    quad(vertexs,textureQuad[nowBlockIndex]);
                }
            }
        }
    }

    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    
    var vPosition=gl.getAttribLocation(program,"vPosition");
    gl.vertexAttribPointer(vPosition,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vPosition);
    
    configureTexture(image)
    var vTexCoord=gl.getAttribLocation(program,"vTexCoord");
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
    
    
    var tBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(texCoords),gl.STATIC_DRAW);
    

    gl.drawArrays(gl.TRIANGLES,0,points.length);
    

}

function CheckBound(row,col){
    return 0<=row&&row<boardRow&&0<=col&&col<boardCol;
}

function CheckMoveRightAndLeft(){
    var tempRow=nowRow;
    var tempCol=nowCol+direction;
    for(var i=0;i<nowBlock[rotate_index].length;++i){
        for(var j=0;j<nowBlock[rotate_index][i].length;++j){
            if(nowBlock[rotate_index][i][j]==1){
                if(!CheckBound(tempRow+i,tempCol+j)){
                    return false;
                }
                if(IsInBlock(tempRow+i,tempCol+j)){
                    return false;
                }
            }
        }
    }
    return true;
}

function CheckRotate(){
    var temp_rotate=(rotate_index+rotate+nowBlock.length)%nowBlock.length;
    var rotatedBlock=blocks[nowBlockIndex][temp_rotate];
    for(var i=0;i<rotatedBlock.length;++i){
        for(var j=0;j<rotatedBlock[i].length;++j){
            if(rotatedBlock[i][j]==1){
                if(!CheckBound(nowRow+i,nowCol+j)){
                    return false;
                }
                if(IsInBlock(nowRow+i,nowCol+j)){
                    return false;
                }
            }
        }
    }
    return true;
}

function RemoveLine(){
    var removeCnt=0;
    var temp=[];
    for(var i=0;i<boardRow;++i){
        var isRemove=true;
        for(var j=0;j<boardCol;++j){
            isRemove=(isRemove&&IsInBlock(i,j));
        }
        if(isRemove){
            removeCnt++;
        }
        else{
            temp.push(isPlacedBlock[i]);
        }
    }
    temp.reverse();
    for(var i=temp.length;i<boardRow;++i){
        var row=[]
        for(var j=0;j<boardCol;++j){
            row.push(-1)
        }
        temp.push(row);
    }
    temp.reverse();
    isPlacedBlock=temp;
    var sc=document.getElementById("score")
    
    sc=parseInt(sc.innerText)
    console.log(sc);
    sc+=scores[removeCnt];
    console.log(sc,toString(sc));
    document.getElementById("score").innerText=sc
}

function CheckDropDown(){
    var tempRow=nowRow+1;
    var tempCol=nowCol;
    for(var i=0;i<nowBlock[rotate_index].length;++i){
        for(var j=0;j<nowBlock[rotate_index][i].length;++j){
            if(nowBlock[rotate_index][i][j]==1){
                if(CheckBound(tempRow+i,tempCol+j)==false){
                    return false;
                }
                if(IsInBlock(tempRow+i,tempCol+j)){
                    return false;
                }
            }
        }
    }
    return true;
}

function CheckBlockStateChange(){
    if(isDrop){
        if(CheckDropDown()){
            return true;
        }
    }
    if(direction!=0){
        if(CheckMoveRightAndLeft()){
            return true;
        }
    }
    if(rotate!=0){
        if(CheckRotate()){
            return true;
        }
    }
    return false;
}


function MoveBlock(){
    if(isDrop&&CheckDropDown()){
        waitTime=0.0;
        nowRow+=1;
        return;
    }
    if(direction!=0&&CheckMoveRightAndLeft()){
        nowCol+=direction;
        return;
    }
    if(rotate!=0&&CheckRotate()){
        rotate_index=(rotate_index+rotate+nowBlock.length)%nowBlock.length;
        return;
    }
}

function FixedBlock(){
    for(var i=0;i<nowBlock[rotate_index].length;++i){
        for(var j=0;j<nowBlock[rotate_index][i].length;++j){
            if(nowBlock[rotate_index][i][j]==1){
                isPlacedBlock[nowRow+i][nowCol+j]=nowBlockIndex;
            }
        }
    }
    nowBlock=null;
}

function IsGameOver(){
    for(var i=0;i<nowBlock[rotate_index].length;++i){
        for(var j=0;j<nowBlock[rotate_index][i];++j){
            if(IsInBlock(nowRow+i,nowCol+j)){
                return true;
            }
        }
    }
    return false;
}

function CreateBlock(){
    nowBlockIndex=parseInt(Math.random()*blocks.length);
    nowBlock=blocks[nowBlockIndex];
    rotate_index=0;
    nowRow=0;
    nowCol=boardCol/2;
}


function GetFramTime(){
    previousTime=nowTime;
    nowTime=new Date()
    return parseFloat(nowTime-previousTime);
}

function Frame(){
    points=[];
    texCoords=[];
    direction=0;
    rotate=0;
    isDrop=false;
    if(nowBlock==null){
        CreateBlock();
        if(IsGameOver()){
            DrawGameDisplay();
            return;
        }
    }
    //회전 판정
    if(isLeftRotate){
        rotate--;
    }
    if(isRightRotate){
        rotate++;
    }

    if(rotate!=0&&CheckRotate()){
        rotate_index=(rotate_index+rotate+nowBlock.length)%nowBlock.length;
    }

    //좌우 움직임 판정
    if(isPressLeftButton){
        direction--;
    }
    if(isPressRightButton){
        direction++;
    }
    
    if(direction!=0&&CheckMoveRightAndLeft()){
        nowCol+=direction;
    }

    //내려가는 판정
    if(waitTime>=1000/speed){
        isDrop=true;
    }
    if(isDrop){
        waitTime=0.0
        if(CheckDropDown()){
            nowRow+=1;
        }
        else{
            FixedBlock();
            RemoveLine();
        }
    }
    
    
    DrawGameDisplay();
    waitTime+=GetFramTime();
    isLeftRotate=isRightRotate=isPressLeftButton=isPressRightButton=false;
    requestAnimationFrame(Frame);
}

function Start(){
    nowRow=1;
    nowCol=boardCol;
    nowBlock=null;
    waitTime=0;
    isPlacedBlock=[];
    for(var i=0;i<boardRow;++i){
        var row=[];
        for(var j=0;j<boardCol;++j){
            row.push(-1);
        }
        isPlacedBlock.push(row);
    }
    nowTime=previousTime=new Date();
    Frame();
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    canvasHeight=canvas.height;
    canvasWidth=canvas.width;
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.enable(gl.DEPTH_TEST);
    OnLoad();
   
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    var vPosition=gl.getAttribLocation(program,"vPosition");
    gl.vertexAttribPointer(vPosition,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLES,0,points.length);

    var vTexCoord=gl.getAttribLocation(program,"vTexCoord");
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );


    image=document.getElementById("texImage");
    configureTexture( image );

    window.addEventListener("keydown",(event)=>{
        if(event.key=="z"){
            isLeftRotate=true;
        }
        if(event.key=='c'){
            isRightRotate=true;
        }
        if(event.key=="ArrowLeft"){
            isPressLeftButton=true;
        }
        if(event.key=="ArrowRight"){
            isPressRightButton=true;
        }
    })
    Start();
}

