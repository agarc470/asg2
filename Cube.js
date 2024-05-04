class Cube{
    constructor(){
        this.type='cube';
        //this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 5.0;
        //this.segments = g_selectedSegments;
        this.matrix = new Matrix4();
    }
    render(){
    //var xy = this.position;
    var rgba = this.color;
    //var size = this.size;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // pass matrix to u_ModelMatrix attribute
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
    // front of cube
    drawTriangle3D( [0.0,0.0,0.0, 1.0,1.0,0.0, 1.0,0.0,0.0] );
    drawTriangle3D( [0.0,0.0,0.0, 0.0,1.0,0.0, 1.0,1.0,0.0] );


    // pass color
    gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[0]);

    // top of cube
    drawTriangle3D( [0,1,0, 0,1,1, 1,1,1] );
    drawTriangle3D( [0,1,0, 1,1,1, 1,1,0] );

    // left side
     drawTriangle3D([0,0,0, 0,1,0, 0,1,1]);
     drawTriangle3D([0,0,0, 0,1,1, 0,0,1]);

    // right side
    drawTriangle3D([1,0,0, 1,1,0, 1,1,1]);
    drawTriangle3D([1,0,0, 1,1,1, 1,0,1]);

    // bottom side
    drawTriangle3D([0,0,0, 1,0,0, 1,0,1]);
    drawTriangle3D([0,0,0, 1,0,1, 0,0,1]);
    
    //back side
    drawTriangle3D([0,0,1, 1,0,1, 1,1,1]);
    drawTriangle3D([0,0,1, 1,1,1, 0,1,1]);

    }

   
}
