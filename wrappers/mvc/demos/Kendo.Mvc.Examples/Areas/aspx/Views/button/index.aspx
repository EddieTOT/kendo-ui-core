﻿<%@ Page Title="" Language="C#" MasterPageFile="~/Areas/aspx/Views/Shared/Web.Master" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<asp:Content ContentPlaceHolderID="HeadContent" runat="server">
</asp:Content>

<asp:Content ContentPlaceHolderID="MainContent" runat="server">

<div class="demo-section k-content">
    <div>
        <h4>Basic Button</h4>
        <p>
    <%= Html.Kendo().Button()
        .Name("primaryTextButton")
        .HtmlAttributes( new {type = "button", @class = "k-primary" } )
        .Content("Primary Button") %>
        
    <%= Html.Kendo().Button()
        .Name("textButton")
        .HtmlAttributes( new {type = "button"} )
        .Content("Button") %>
        </p>
    </div>
    
    <div>
        <h4>Disabled buttons via configuration</h4>
        <p>
    <%= Html.Kendo().Button()
            .Name("primaryDisabledButton1")
            .HtmlAttributes( new { @class = "k-primary" } )
            .Tag("span")
            .Enable(false)
            .Content("Disabled Primary Button") %>
            
    <%= Html.Kendo().Button()
            .Name("disabledButton1")
            .Tag("span")
            .Enable(false)
            .Content("Disabled Button") %>                 
        </p>
    </div>
    
    <div>
        <h4>Disabled buttons via HTML attribute</h4>
        <p>
    <%= Html.Kendo().Button()
            .Name("primaryDisabledButton2")
            .HtmlAttributes( new { disabled = "disabled" , @class = "k-primary" } )
            .Tag("span")
            .Content("Disabled Primary Button") %>
            
    <%= Html.Kendo().Button()
            .Name("disabledButton2")
            .Tag("span")
            .HtmlAttributes(new { disabled = "disabled" })
            .Content("Disabled Button") %>                 
        </p>
    </div>
    
    <div>
       <h4>Buttons with icons</h4>
        <p>
    <%= Html.Kendo().Button()
        .Name("iconTextButton")
        .Tag("a")
        .SpriteCssClass("k-icon k-i-funnel")
        .Content("Filter") %>
    
    <%= Html.Kendo().Button()
        .Name("kendoIconTextButton")
        .Tag("a")
        .Icon("funnel-clear")
        .Content("Clear Filter") %>
    
    <%= Html.Kendo().Button()
        .Name("iconButton")
        .Tag("em")
        .SpriteCssClass("k-icon k-i-refresh")
        .Content("<span class='k-sprite'>Refresh</span>") %>
        </p>
    </div> 
</div>

<style>
    .demo-section p {
        margin: 0 0 30px;
        line-height: 50px;
    }
    .demo-section p .k-button {
        margin: 0 10px 0 0;
    }
    .k-primary {
        min-width: 150px;
    }                
</style>

</asp:Content>